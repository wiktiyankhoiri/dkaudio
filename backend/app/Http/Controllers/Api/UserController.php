<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(User::latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required',
            'username' => 'required|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'role' => 'required|in:owner,admin,kasir',
        ]);

        $user = User::create([
            'nama' => $request->nama,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'create',
            'table_name' => 'users',
            'reference_id' => $user->id,
            'description' => 'User ' . $user->nama . ' dibuat',
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'nama' => 'required',
            'username' => 'required|unique:users,username,' . $user->id,
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:6',
            'role' => 'required|in:owner,admin,kasir',
        ]);

        $data = $request->except('password');
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'table_name' => 'users',
            'reference_id' => $user->id,
            'description' => 'User ' . $user->nama . ' diperbarui',
        ]);

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri'], 422);
        }

        $user->delete();

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'delete',
            'table_name' => 'users',
            'reference_id' => $user->id,
            'description' => 'User ' . $user->nama . ' dihapus',
        ]);

        return response()->json(['message' => 'Dihapus']);
    }
}
