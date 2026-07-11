<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $unreadCount = Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->count();

        $recent = Notification::where('user_id', auth()->id())
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'unread_count' => $unreadCount,
            'recent' => $recent,
        ]);
    }

    public function list(Request $request)
    {
        $query = Notification::where('user_id', auth()->id());

        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 20));
    }

    public function read(Notification $notification)
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->update(['is_read' => true]);

        return response()->json($notification);
    }

    public function readAll()
    {
        Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Semua notifikasi sudah dibaca']);
    }
}
