import 'package:bcrypt/bcrypt.dart';

abstract final class PinHasher {
  static String hash(String pin) {
    if (pin.length != 4 || !RegExp(r'^\d{4}$').hasMatch(pin)) {
      throw ArgumentError('PIN must be exactly 4 digits');
    }
    return BCrypt.hashpw(pin, BCrypt.gensalt());
  }

  static bool verify(String pin, String hash) {
    if (pin.length != 4) return false;
    try {
      return BCrypt.checkpw(pin, hash);
    } catch (_) {
      return false;
    }
  }
}
