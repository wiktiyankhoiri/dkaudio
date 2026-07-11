<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user');

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->table_name) {
            $query->where('table_name', $request->table_name);
        }

        if ($request->dari) {
            $query->whereDate('created_at', '>=', $request->dari);
        }

        if ($request->sampai) {
            $query->whereDate('created_at', '<=', $request->sampai);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 50));
    }

    public function show(AuditLog $auditLog)
    {
        return response()->json($auditLog->load('user'));
    }
}
