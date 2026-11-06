import '../constants/app_constants.dart';

abstract final class OrderNumberGenerator {
  static String formatDaily(int sequence, {DateTime? date}) {
    final d = date ?? DateTime.now();
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    final seq = sequence.toString().padLeft(3, '0');
    return '$day$month$seq';
  }

  static String formatLocal(String outletId, int sequence, {DateTime? date}) {
    final daily = formatDaily(sequence, date: date);
    final prefix = outletId.length >= 4 ? outletId.substring(0, 4) : outletId;
    return '${AppConstants.localOrderPrefix}$prefix$daily';
  }

  static bool isLocalOrderNumber(String orderNumber) =>
      orderNumber.startsWith(AppConstants.localOrderPrefix);
}
