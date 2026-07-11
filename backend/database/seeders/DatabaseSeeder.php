<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Kategori;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::create([
            'nama' => 'Owner',
            'username' => 'owner',
            'email' => 'owner@dkaudio.com',
            'password' => Hash::make('owner'),
            'role' => 'owner',
        ]);

        User::create([
            'nama' => 'Admin',
            'username' => 'admin',
            'email' => 'admin@dkaudio.com',
            'password' => Hash::make('admin'),
            'role' => 'admin',
        ]);

        User::create([
            'nama' => 'Kasir',
            'username' => 'kasir',
            'email' => 'kasir@dkaudio.com',
            'password' => Hash::make('kasir'),
            'role' => 'kasir',
        ]);

        $kategoriList = [
            'Speaker',
            'Mixer',
            'Amplifier',
            'Microphone',
            'Kabel & Connector',
            'DSP / Processor',
            'Lighting',
            'Aksesoris',
        ];

        foreach ($kategoriList as $nama) {
            Kategori::create(['nama_kategori' => $nama]);
        }
    }
}
