<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RefreshToken extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'token', 'family_hash', 'expires_at', 'revoked_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isValid()
    {
        return !$this->revoked_at && now()->lessThan($this->expires_at);
    }

    public static function generateFamilyHash()
    {
        return hash('sha256', Str::random(40));
    }

    public static function generateTokenValue()
    {
        return hash('sha256', Str::random(60));
    }
}
