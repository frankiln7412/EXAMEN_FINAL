<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\AdminController;

Route::prefix('v1')->group(function () {

    // Public routes
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('auth/mfa/verify', [AuthController::class, 'verifyMfa']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/mfa/enable', [AuthController::class, 'enableMfa']);

        Route::get('me', [ProfileController::class, 'me']);

        Route::get('wallet', [WalletController::class, 'show']);
        Route::post('wallet/topup', [WalletController::class, 'topup']);

        Route::post('transfers', [TransferController::class, 'store'])->middleware('throttle:transfers');
        Route::post('transfers/{uuid}/confirm', [TransferController::class, 'confirm']);

        Route::get('transactions', [TransactionController::class, 'index']);

        // Admin routes
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('users', [AdminController::class, 'users']);
            Route::patch('users/{uuid}/block', [AdminController::class, 'block']);
            Route::get('audit-logs', [AdminController::class, 'auditLogs']);
        });
    });
});
