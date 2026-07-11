<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateQueryToken
{
    public function handle(Request $request, Closure $next): Response
    {
        // Check Bearer token first (used by fetch/JSON API)
        if ($request->bearerToken()) {
            $accessToken = PersonalAccessToken::findToken($request->bearerToken());
            if ($accessToken) {
                auth()->login($accessToken->tokenable);
            }
        }

        // Fallback to query string token (used by anchor download)
        if (!auth()->check()) {
            $token = $request->query('token');
            if ($token) {
                $accessToken = PersonalAccessToken::findToken($token);
                if ($accessToken) {
                    auth()->login($accessToken->tokenable);
                }
            }
        }

        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return $next($request);
    }
}
