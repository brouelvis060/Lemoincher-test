<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;

Route::get('/', [PageController::class, 'home']);

// Routes "client"
Route::get('/products', [PageController::class, 'products']);
Route::get('/product/{id}', [PageController::class, 'productDetail']);
Route::get('/cart', [PageController::class, 'cart']);
Route::get('/checkout', [PageController::class, 'checkout']);
Route::get('/login', [PageController::class, 'login']);
Route::get('/register', [PageController::class, 'register']);
Route::get('/orders', [PageController::class, 'orders']);
Route::get('/orders/{id}', [PageController::class, 'orderDetail']);
Route::get('/profile', [PageController::class, 'profile']);

// Routes "admin" (catch-all pour conserver les URLs existantes)
Route::get('/admin', [PageController::class, 'admin']);
Route::get('/admin/{any}', [PageController::class, 'adminCatchAll'])->where('any', '.*');
