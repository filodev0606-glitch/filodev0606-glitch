import '../constants/enums.dart';

abstract final class PermissionChecker {
  static const Map<UserRole, Set<Permission>> _defaults = {
    UserRole.owner: {
      Permission.manageOutlets,
      Permission.manageAllOutlets,
      Permission.manageMenu,
      Permission.manageStock,
      Permission.manageCashiers,
      Permission.manageSettings,
      Permission.inputApiKeys,
      Permission.posSell,
      Permission.holdOrder,
      Permission.voidRefund,
      Permission.manageShift,
      Permission.branchReports,
      Permission.allBranchReports,
      Permission.switchOutlet,
    },
    UserRole.admin: {
      Permission.manageMenu,
      Permission.manageStock,
      Permission.manageCashiers,
      Permission.manageSettings,
      Permission.inputApiKeys,
      Permission.posSell,
      Permission.holdOrder,
      Permission.voidRefund,
      Permission.manageShift,
      Permission.branchReports,
    },
    UserRole.cashier: {
      Permission.posSell,
      Permission.holdOrder,
      Permission.manageShift,
    },
  };

  /// Overrides dari Owner (role name → permission key → bool).
  static Map<String, Map<String, bool>> _overrides = {};

  static void setOverrides(Map<String, Map<String, bool>> overrides) {
    _overrides = {
      for (final e in overrides.entries) e.key: Map<String, bool>.from(e.value),
    };
  }

  static Map<String, Map<String, bool>> get overrides => {
        for (final e in _overrides.entries) e.key: Map<String, bool>.from(e.value),
      };

  static Map<String, bool>? overridesFor(UserRole role) => _overrides[role.name];

  /// Default permission map (semua Permission keys) untuk UI editor.
  static Map<String, bool> defaultMapFor(UserRole role) {
    final granted = _defaults[role] ?? {};
    return {
      for (final p in Permission.values) p.key: granted.contains(p),
    };
  }

  /// Effective map = default digabung override.
  static Map<String, bool> effectiveMapFor(UserRole role) {
    final base = defaultMapFor(role);
    final custom = _overrides[role.name];
    if (custom == null) return base;
    return {...base, ...custom};
  }

  static bool hasPermission({
    required UserRole role,
    required Permission permission,
    Map<String, bool>? customPermissions,
  }) {
    // Owner selalu penuh (tidak bisa dikunci dari HP lain).
    if (role == UserRole.owner) return true;

    final custom = customPermissions ?? _overrides[role.name];
    if (custom?.containsKey(permission.key) == true) {
      return custom![permission.key] ?? false;
    }
    return _defaults[role]?.contains(permission) ?? false;
  }
}
