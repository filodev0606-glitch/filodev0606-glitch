abstract final class ConflictResolver {
  static bool hasStockConflict(Map<String, dynamic> response) =>
      response['stockConflict'] == true;

  static String resolveOrderStatus(Map<String, dynamic> response) {
    if (hasStockConflict(response)) return 'stock_conflict';
    return 'completed';
  }
}
