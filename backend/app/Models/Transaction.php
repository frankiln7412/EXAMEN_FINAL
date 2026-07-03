<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Transaction extends Model
{
    protected $fillable = [
        'uuid', 'wallet_id', 'type', 'amount', 'counterparty_id',
        'description', 'balance_before', 'balance_after', 'status',
        'idempotency_key', 'expires_at'
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'expires_at' => 'datetime',
        ];
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    public function counterparty()
    {
        return $this->belongsTo(Wallet::class, 'counterparty_id');
    }

    protected static function booted()
    {
        static::creating(function ($tx) {
            if (empty($tx->uuid)) {
                $tx->uuid = (string) Str::uuid();
            }
        });
    }
}
