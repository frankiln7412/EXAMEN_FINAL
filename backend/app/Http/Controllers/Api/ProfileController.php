<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user()->load('wallet');

        return response()->json([
            'uuid' => $user->uuid,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'ci' => $user->ci,
            'role' => $user->role,
            'mfa_enabled' => $user->mfa_enabled,
            'wallet' => [
                'uuid' => $user->wallet->uuid,
                'balance' => $user->wallet->balance,
            ],
        ]);
    }
}
