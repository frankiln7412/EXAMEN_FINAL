<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\RefreshToken;
use App\Models\User;
use App\Models\Wallet;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FALaravel\Google2FA;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        if ($request->captcha_token !== 'test-captcha') {
            return response()->json(['message' => 'Invalid captcha.'], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'ci' => $request->ci,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password, ['rounds' => 12]),
            'role' => 'user',
        ]);

        Wallet::create([
            'user_id' => $user->id,
            'balance' => 0.00,
        ]);

        $accessToken = $user->createToken('auth-token', ['user'])->plainTextToken;

        $familyHash = RefreshToken::generateFamilyHash();
        $refreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => RefreshToken::generateTokenValue(),
            'family_hash' => $familyHash,
            'expires_at' => now()->addDays(7),
        ]);

        AuditService::logWithRequest($user->id, 'register', $request);

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
            'user' => [
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if ($user->isBlocked()) {
            return response()->json(['message' => 'Account blocked. Try again later.'], 423);
        }

        if (!Hash::check($request->password, $user->password)) {
            $user->increment('login_attempts');

            if ($user->login_attempts >= 5) {
                $user->update(['blocked_until' => now()->addMinutes(15)]);
                AuditService::logWithRequest($user->id, 'login_blocked', $request);
            }

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        $user->update(['login_attempts' => 0, 'blocked_until' => null]);

        $abilities = $user->isAdmin() ? ['admin'] : ['user'];
        $accessToken = $user->createToken('auth-token', $abilities)->plainTextToken;

        $familyHash = RefreshToken::generateFamilyHash();
        $refreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => RefreshToken::generateTokenValue(),
            'family_hash' => $familyHash,
            'expires_at' => now()->addDays(7),
        ]);

        AuditService::logWithRequest($user->id, 'login', $request);

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
            'user' => [
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function verifyMfa(Request $request)
    {
        $request->validate([
            'ticket' => ['required', 'string'],
            'totp_code' => ['required', 'string', 'size:6'],
        ]);

        try {
            $userId = Crypt::decryptString($request->ticket);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid ticket.'], 422);
        }

        $user = User::findOrFail($userId);

        $google2fa = app(Google2FA::class);
        $valid = $google2fa->verifyKey($user->mfa_secret, $request->totp_code);

        if (!$valid) {
            return response()->json(['message' => 'Invalid TOTP code.'], 422);
        }

        $user->update(['login_attempts' => 0, 'blocked_until' => null]);

        $abilities = $user->isAdmin() ? ['admin'] : ['user'];
        $accessToken = $user->createToken('auth-token', $abilities)->plainTextToken;

        $familyHash = RefreshToken::generateFamilyHash();
        $refreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => RefreshToken::generateTokenValue(),
            'family_hash' => $familyHash,
            'expires_at' => now()->addDays(7),
        ]);

        AuditService::logWithRequest($user->id, 'mfa_verified', $request);

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->token,
            'token_type' => 'Bearer',
            'user' => [
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $refreshToken = RefreshToken::where('token', $request->refresh_token)->first();

        if (!$refreshToken) {
            return response()->json(['message' => 'Invalid refresh token.'], 401);
        }

        if ($refreshToken->revoked_at) {
            RefreshToken::where('family_hash', $refreshToken->family_hash)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            return response()->json(['message' => 'Token reuse detected. All tokens revoked.'], 401);
        }

        if (now()->greaterThan($refreshToken->expires_at)) {
            return response()->json(['message' => 'Refresh token expired.'], 401);
        }

        $refreshToken->update(['revoked_at' => now()]);

        $user = $refreshToken->user;

        $abilities = $user->isAdmin() ? ['admin'] : ['user'];
        $accessToken = $user->createToken('auth-token', $abilities)->plainTextToken;

        $newRefreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => RefreshToken::generateTokenValue(),
            'family_hash' => $refreshToken->family_hash,
            'expires_at' => now()->addDays(7),
        ]);

        AuditService::logWithRequest($user->id, 'token_refreshed', $request);

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $newRefreshToken->token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $request->user()->currentAccessToken()->delete();

        RefreshToken::where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);

        AuditService::logWithRequest($user->id, 'logout', $request);

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function enableMfa(Request $request)
    {
        $user = $request->user();

        $google2fa = app(Google2FA::class);
        $secret = $google2fa->generateSecretKey();
        $qrCodeUrl = $google2fa->getQRCodeUrl('SecureWallet', $user->email, $secret);

        $user->update([
            'mfa_secret' => $secret,
            'mfa_enabled' => true,
        ]);

        AuditService::logWithRequest($user->id, 'mfa_enabled', $request);

        return response()->json([
            'message' => 'MFA enabled successfully.',
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    public function disableMfa(Request $request)
    {
        $user = $request->user();

        $user->update([
            'mfa_secret' => null,
            'mfa_enabled' => false,
        ]);

        AuditService::logWithRequest($user->id, 'mfa_disabled', $request);

        return response()->json(['message' => 'MFA disabled successfully.']);
    }
}
