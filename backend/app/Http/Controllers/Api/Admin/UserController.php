<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $userAuth = auth()->user();
        if (!$userAuth->hasRole('admin') && !$userAuth->hasPermissionTo('read-users')) {
            return response()->json(['message' => 'Unauthorized: You cannot create appointments'], 403);
        }
        $users = User::all();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $userAuth = auth()->user();
        if (!$userAuth->hasRole('admin') && !$userAuth->hasPermissionTo('create-users')) {
            return response()->json(['message' => 'Unauthorized: You cannot create appointments'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => [
                'required',
                Rule::exists('roles', 'name')->where('guard_name', 'api'),
            ],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole($request->role);
        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ]);
    }

    public function show($id)
    {
        $user = User::with('roles')->findOrFail($id);
        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $userAuth = auth()->user();
        if (!$userAuth->hasRole('admin') && !$userAuth->hasPermissionTo('update-users')) {
            return response()->json(['message' => 'Unauthorized: You cannot create appointments'], 403);
        }
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:6',
            'role' => [
                'sometimes',
                Rule::exists('roles', 'name')->where('guard_name', 'api'),
            ],
        ]);
        
        if ($request->has('name')) $user->name = $request->name;
        if ($request->has('email')) $user->email = $request->email;
        if ($request->has('password')) $user->password = Hash::make($request->password);
        $user->save();

        if ($request->has('role')) {
            $user->role = $request->role;
            $user->save();
            $user->syncRoles([$request->role]);
        }

        $user->load('roles');
        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    public function destroy($id)
    {
        $userAuth = auth()->user();
        if (!$userAuth->hasRole('admin') && !$userAuth->hasPermissionTo('delete-users')) {
            return response()->json(['message' => 'Unauthorized: You cannot create appointments'], 403);
        }
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }
}
