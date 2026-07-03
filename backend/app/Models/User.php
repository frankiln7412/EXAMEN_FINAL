<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'uuid', 'name', 'ci', 'email', 'phone', 'password',
        'role', 'mfa_secret', 'mfa_enabled',
        'blocked_until', 'login_attempts'
    ];

    protected $hidden = [
        'password', 'mfa_secret', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mfa_enabled' => 'boolean',
            'blocked_until' => 'datetime',
        ];
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isBlocked()
    {
        return $this->blocked_until && now()->lessThan($this->blocked_until);
    }

    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                $user->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
