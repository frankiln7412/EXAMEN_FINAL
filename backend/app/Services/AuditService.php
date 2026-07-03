<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    public static function log($userId, $action, $request = null, $details = null)
    {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'details' => $details,
        ]);
    }

    public static function logWithRequest($userId, $action, $request, $details = null)
    {
        return self::log($userId, $action, $request, $details);
    }
}
