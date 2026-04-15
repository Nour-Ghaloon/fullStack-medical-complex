<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'status' => true,
            'message' => 'Register successfully',
            'user' => $user,
            'token' => $token,
        ]);
    }
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string',
        ]);
        if (empty($request->email) && empty($request->phone)) {
            return response()->json([
                'status' => false,
                'message' => 'يجب إدخال البريد الإلكتروني'
            ], 422);
        }
        if (!empty($request->email)) {
            $user = User::where('email', $request->email)->first();
        }

        if (! $user) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (!$token = JWTAuth::attempt(['email' => $user->email, 'password' => $request->password])) {
            return response()->json([
                'status' => false,
                'message' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            ], 401);
        }
        return response()->json([
            'message' => 'Login successfully',
            'user' => $user,
            'token' => $token,

        ]);
    }

    public function logout()
    {
        auth()->logout();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function profile()
    {
        // $user = Auth::user();
        // return response()->json($user);
        $user = auth()->user();

        // تحميل العلاقة المناسبة بناءً على النوع (Eager Loading)
        $user->load(['doctor', 'patient']);

        // تحديد المصدر (إما جدول الدكتور أو جدول المريض)
        $profileDetail = $user->doctor ?? $user->patient;

        return response()->json([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->roles->pluck('name')->first(), // لجلب اسم الدور
            'profile' => [
                'phone'   => $profileDetail?->phone,
                // توحيد الحقول: hire_date للدكتور و date_of_birth للمريض
                'dob'     => $user->doctor ? $profileDetail?->hire_date : $profileDetail?->date_of_birth,
                'address' => $profileDetail?->address,
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $validator = Validator::make(
            $request->all(),
            [
                'name'       => 'required|string|max:255',
                'email'     => 'nullable|email|unique:users,email,' . $user->id,
                'phone' => 'nullable',
                'hire_date'   => 'nullable|date',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->only(['name', 'email']);

        $user->update($data);
        $user->refresh();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    // public function updateProfile(Request $request)
    // {
    //     $user = $request->user();

    //     // استخدامvalidated لضمان جلب البيانات النظيفة
    //     $validated = $request->validate([
    //         'name'  => 'required|string|max:255',
    //         'email' => 'nullable|email|unique:users,email,' . $user->id,
    //         'phone' => 'nullable',
    //         'dob'   => 'nullable|date',
    //     ]);

    //     if ($user->hasRole('doctor')) {
    //         $user->doctor()->update([
    //             'phone'     => $validated['phone'],
    //             'hire_date' => $validated['dob'], // بجدول الدكتور اسمه hire_date
    //         ]);
    //     } else if ($user->hasRole('patient')) {
    //         $user->patient()->update([
    //             'phone'         => $validated['phone'],
    //             'date_of_birth' => $validated['dob'], // بجدول المريض اسمه date_of_birth
    //         ]);
    //     }

    //     // تحديث بيانات المستخدم الأساسية
    //     $user->update([
    //         'name' => $validated['name'],
    //         'email' => $validated['email'],
    //     ]);

    //     return response()->json([
    //         'message' => 'Profile updated successfully',
    //         'user' => $user->load(['doctor', 'patient']) // تحميل البيانات الجديدة
    //     ]);
    // }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $passwordRules = ['required', 'confirmed'];
        $request->validate([
            'currentpassword' => ['required'],
            'newpassword'     => $passwordRules,
        ], [
            'currentpassword.required' => 'حقل كلمة المرور الحالي مطلوب',
            'newpassword.required'     => 'حقل كلمة المرور مطلوب',
            'newpassword.confirmed'    => 'تأكيد كلمة المرور غير متطابق',
        ]);

        if (!Hash::check($request->currentpassword, $user->password)) {
            return response()->json([
                'status' => false,
                'message' => 'كلمة المرور الحالية غير صحيحة'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->newpassword),
        ]);

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح',
        ]);
    }


    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'تم حذف الحساب بنجاح']);
    }
}
