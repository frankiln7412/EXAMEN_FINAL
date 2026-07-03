<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('uuid')->unique()->after('id');
            $table->string('ci')->after('name');
            $table->string('phone')->after('email');
            $table->string('role')->default('user')->after('phone');
            $table->text('mfa_secret')->nullable()->after('role');
            $table->boolean('mfa_enabled')->default(false)->after('mfa_secret');
            $table->timestamp('blocked_until')->nullable()->after('mfa_enabled');
            $table->integer('login_attempts')->default(0)->after('blocked_until');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['uuid', 'ci', 'phone', 'role', 'mfa_secret', 'mfa_enabled', 'blocked_until', 'login_attempts']);
        });
    }
};
