<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmTransferRequest;
use App\Http\Requests\TransferRequest;
use App\Models\Transaction;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PragmaRX\Google2FALaravel\Google2FA;

class TransferController extends Controller
{
    public function store(TransferRequest $request)
    {
        $user = $request->user();
        $idempotencyKey = $request->header('Idempotency-Key');

        if (!$idempotencyKey) {
            return response()->json(['message' => 'Idempotency-Key header is required.'], 422);
        }

        $existing = Transaction::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return response()->json([
                'message' => 'This request has already been processed.',
                'transaction' => $existing,
            ], 409);
        }

        $recipient = User::where('email', $request->destinatario)
            ->orWhere('phone', $request->destinatario)
            ->first();

        if (!$recipient) {
            return response()->json(['message' => 'Recipient not found.'], 404);
        }

        if ($recipient->id === $user->id) {
            return response()->json(['message' => 'Cannot transfer to yourself.'], 422);
        }

        $senderWallet = $user->wallet;
        if ($senderWallet->balance < $request->monto) {
            return response()->json(['message' => 'Insufficient balance.'], 422);
        }

        $requiresTotp = $request->monto > 500;

        $transaction = Transaction::create([
            'wallet_id' => $senderWallet->id,
            'type' => 'transfer_out',
            'amount' => $request->monto,
            'counterparty_id' => $recipient->wallet->id,
            'description' => $request->descripcion,
            'balance_before' => $senderWallet->balance,
            'balance_after' => $senderWallet->balance - $request->monto,
            'status' => 'pending',
            'idempotency_key' => $idempotencyKey,
            'expires_at' => now()->addMinutes(2),
        ]);

        AuditService::logWithRequest($user->id, 'transfer_initiated', $request, [
            'transaction_uuid' => $transaction->uuid,
            'amount' => $request->monto,
            'recipient' => $recipient->email,
            'requires_totp' => $requiresTotp,
        ]);

        return response()->json([
            'message' => 'Transfer initiated.',
            'transaction_uuid' => $transaction->uuid,
            'requires_totp' => $requiresTotp,
            'expires_at' => $transaction->expires_at,
        ], 201);
    }

    public function confirm($uuid, ConfirmTransferRequest $request)
    {
        $user = $request->user();
        $senderWallet = $user->wallet;

        $transaction = Transaction::where('uuid', $uuid)
            ->where('wallet_id', $senderWallet->id)
            ->where('status', 'pending')
            ->first();

        if (!$transaction) {
            return response()->json(['message' => 'Pending transaction not found.'], 404);
        }

        if (now()->greaterThan($transaction->expires_at)) {
            $transaction->update(['status' => 'failed']);
            return response()->json(['message' => 'Transaction expired.'], 422);
        }

        if ($transaction->amount > 500) {
            $totpCode = $request->totp_code;
            if (!$totpCode) {
                return response()->json(['message' => 'TOTP code is required for amounts over 500.'], 422);
            }

            $google2fa = app(Google2FA::class);
            $valid = $google2fa->verifyKey($user->mfa_secret, $totpCode);
            if (!$valid) {
                return response()->json(['message' => 'Invalid TOTP code.'], 422);
            }
        }

        $recipientWallet = $transaction->counterparty;

        try {
            DB::beginTransaction();

            $senderLocked = $senderWallet->lockForUpdate()->first();
            $recipientLocked = $recipientWallet->lockForUpdate()->first();

            if ($senderLocked->balance < $transaction->amount) {
                $transaction->update(['status' => 'failed']);
                DB::commit();
                return response()->json(['message' => 'Insufficient balance.'], 422);
            }

            $senderLocked->decrement('balance', $transaction->amount);
            $recipientLocked->increment('balance', $transaction->amount);

            $transaction->update([
                'status' => 'completed',
                'balance_before' => $senderLocked->balance + $transaction->amount,
                'balance_after' => $senderLocked->balance,
            ]);

            Transaction::create([
                'wallet_id' => $recipientWallet->id,
                'type' => 'transfer_in',
                'amount' => $transaction->amount,
                'counterparty_id' => $senderWallet->id,
                'description' => $transaction->description,
                'balance_before' => $recipientLocked->balance - $transaction->amount,
                'balance_after' => $recipientLocked->balance,
                'status' => 'completed',
                'idempotency_key' => $transaction->idempotency_key . '_in',
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        AuditService::logWithRequest($user->id, 'transfer_completed', $request, [
            'transaction_uuid' => $transaction->uuid,
            'amount' => $transaction->amount,
        ]);

        return response()->json([
            'message' => 'Transfer completed successfully.',
            'transaction_uuid' => $transaction->uuid,
        ]);
    }
}
