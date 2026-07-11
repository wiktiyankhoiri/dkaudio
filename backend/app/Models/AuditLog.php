<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'audit_log';

    protected $fillable = ['user_id', 'action', 'table_name', 'reference_id', 'description', 'data'];

    public function setDescriptionAttribute($value)
    {
        $this->attributes['description'] = strip_tags($value);
    }

    protected $casts = ['data' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
