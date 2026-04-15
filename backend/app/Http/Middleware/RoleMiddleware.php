<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;


class RoleMiddleware
{
    
    public function handle(Request $request, Closure $next, ...$role)
    {
        if(! auth()->check()){
            return response()->jsin([
                'message' => 'Unauthenticated'
            ], 401);
        }

        if (! in_array(auth()->user()->role, $role)){
            return response()->json([
                'message' => 'Forbidden - insufficient role'
            ], 403);
        }
        
        return $next($request);
    }
}
