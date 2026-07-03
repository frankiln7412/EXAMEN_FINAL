<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TopupRequest;
use App\Models\Transaction;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = $request->user()->wallet;

        return response()->json([
            'uuid' => $wallet->uuid,
            'balance' => $wallet->balance,
        ]);
    }

    public function topup(TopupRequest $request)
    {
        $user = $request->user();

        $transaction = DB::transaction(function () use ($user, $request) {
            $wallet = $user->wallet()->lockForUpdate()->first();

            $balanceBefore = $wallet->balance;
            $wallet->increment('balance', $request->amount);

            return Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'topup',
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $wallet->fresh()->balance,
                'status' => 'completed',
            ]);
        });

        AuditService::logWithRequest($user->id, 'topup', $request, [
            'amount' => $request->amount,
            'transaction_uuid' => $transaction->uuid,
        ]);

        return response()->json([
            'message' => 'Topup successful.',
            'transaction' => $transaction,
        ]);
    }
}
