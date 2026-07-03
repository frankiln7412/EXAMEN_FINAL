<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'destinatario' => ['required', 'string'],
            'monto' => ['required', 'numeric', 'min:1', 'max:5000'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ];
    }
}
