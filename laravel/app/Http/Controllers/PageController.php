<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class PageController extends Controller
{
    public function home(): View
    {
        return view('pages.shell');
    }

    public function products(): View
    {
        return view('pages.shell');
    }

    public function productDetail(string $id): View
    {
        return view('pages.shell');
    }

    public function cart(): View
    {
        return view('pages.shell');
    }

    public function checkout(): View
    {
        return view('pages.shell');
    }

    public function login(): View
    {
        return view('pages.shell');
    }

    public function register(): View
    {
        return view('pages.shell');
    }

    public function orders(): View
    {
        return view('pages.shell');
    }

    public function orderDetail(string $id): View
    {
        return view('pages.shell');
    }

    public function profile(): View
    {
        return view('pages.shell');
    }

    public function admin(): View
    {
        return view('pages.shell');
    }

    public function adminCatchAll(): View
    {
        return view('pages.shell');
    }
}

