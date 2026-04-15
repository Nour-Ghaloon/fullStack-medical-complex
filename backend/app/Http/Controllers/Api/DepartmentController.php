<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    // GET /api/departments
    public function index()
    {
        return response()->json(
            Department::withCount('doctors')
                ->orderBy('name')
                ->get()
        );
    }

    // POST /api/departments
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:departments,code',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($validated);

        return response()->json($department->loadCount('doctors'), 201);
    }

    // GET /api/departments/{id}
    public function show(Department $department)
    {
        return response()->json($department->loadCount('doctors'));
    }

    // PUT /api/departments/{id}
    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:departments,code,' . $department->id,
            'description' => 'nullable|string',
        ]);

        $department->update($validated);

        return response()->json($department->loadCount('doctors'));
    }

    // DELETE /api/departments/{id}
    public function destroy(Department $department)
    {
        // optional safety check
        if ($department->doctors()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department with assigned doctors'
            ], 422);
        }

        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully'
        ]);
    }
}
