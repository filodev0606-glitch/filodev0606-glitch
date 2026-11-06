/// Kebijakan checkout: bisa offline atau harus online.
///
/// Tunai, transfer, dan split ditulis ke cache lokal Firestore lalu disinkronkan
/// saat koneksi kembali. Hanya "bon" yang butuh server, karena nomor
/// faktur dialokasikan oleh penghitung di sisi server.
bool checkoutRequiresOnline({
  required String paymentMethod,
  required bool splitMode,
}) =>
    paymentMethod == 'bon';

bool canOpenCheckout({required bool online}) => true;

bool canSubmitCheckout({
  required bool online,
  required String paymentMethod,
  required bool splitMode,
}) {
  final needsServer = checkoutRequiresOnline(
    paymentMethod: paymentMethod,
    splitMode: splitMode,
  );
  return needsServer ? online : true;
}
