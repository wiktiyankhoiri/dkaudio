<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StokOpname extends Model
{
    protected $table = 'stok_opname';

    protected $fillable = ['no_opname', 'tanggal_opname', 'status', 'catatan', 'user_id'];

    protected $casts = ['tanggal_opname' => 'date'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function details()
    {
        return $this->hasMany(StokOpnameDetail::class, 'stok_opname_id');
    }
}
