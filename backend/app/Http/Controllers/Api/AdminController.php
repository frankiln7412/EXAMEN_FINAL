<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(Request $request)
    {
        $users = User::with('wallet')->paginate(20);

        return response()->json($users);
    }

    public function block($uuid, Request $request)
    {
        $user = User::where('uuid', $uuid)->firstOrFail();

        if ($user->isBlocked()) {
            $user->update(['blocked_until' => null, 'login_attempts' => 0]);
            $action = 'unblocked';
        } else {
            $user->update(['blocked_until' => now()->addHours(24)]);
            $action = 'blocked';
        }

        AuditService::logWithRequest($request->user()->id, "user_{$action}", $request, [
            'target_user_uuid' => $uuid,
        ]);

        return response()->json([
            'message' => "User {$action} successfully.",
            'blocked_until' => $user->blocked_until,
        ]);
    }

    public function auditLogs(Request $request)
    {
        $logs = AuditLog::with('user:id,uuid,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($logs);
    }
}
