<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@securewallet.com',
            'password' => Hash::make('Admin123!@#'),
            'role' => 'admin',
            'ci' => '12345678',
            'phone' => '70000000',
        ]);

        Wallet::create([
            'user_id' => $admin->id,
            'balance' => 1000.00,
        ]);

        $juan = User::create([
            'name' => 'Juan Perez',
            'email' => 'juan@test.com',
            'password' => Hash::make('User1234!@'),
            'role' => 'user',
            'ci' => '87654321',
            'phone' => '70123456',
        ]);

        Wallet::create([
            'user_id' => $juan->id,
            'balance' => 1000.00,
        ]);

        $maria = User::create([
            'name' => 'Maria Lopez',
            'email' => 'maria@test.com',
            'password' => Hash::make('User1234!@'),
            'role' => 'user',
            'ci' => '11223344',
            'phone' => '70789012',
        ]);

        Wallet::create([
            'user_id' => $maria->id,
            'balance' => 1000.00,
        ]);
    }
}
