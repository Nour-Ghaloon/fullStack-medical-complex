<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    // GET /api/services
    public function index()
    {
        return Service::with('department')->get();
    }

    // POST /api/services
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100|unique:services,code',
            'description' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'price' => 'required|numeric|min:0',
            'duration' => 'nullable|integer|min:1',
            'status' => 'in:active,inactive',
        ]);

        $service = Service::create($validated);

        return response()->json($service, 201);
    }

    // GET /api/services/{service}
    public function show(Service $service)
    {
        return $service->load('department');
    }

    // PUT /api/services/{service}
    public function update(Request $request, Service $service)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:100|unique:services,code,' . $service->id,
            'description' => 'nullable|string',
            'department_id' => 'sometimes|exists:departments,id',
            'price' => 'sometimes|required|numeric|min:0',
            'duration' => 'nullable|integer|min:1',
            'status' => 'in:active,inactive',
        ]);

        $service->update($validated);

        return response()->json($service);
    }

    // DELETE /api/services/{service}
    public function destroy(Service $service)
    {
        $service->delete();

        return response()->json([
            'message' => 'Service deleted successfully'
        ]);
    }
}
