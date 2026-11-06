import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../core/constants/enums.dart';
import '../datasources/local/palmera_local_database.dart';
import '../repositories/repository_providers.dart';
import 'sync_worker.dart';

/// Enqueues Firestore sync jobs from repository writes.
class SyncEnqueue {
  SyncEnqueue(
    this._db,
    this._uuid, {
    Future<void> Function()? flush,
  }) : _flush = flush;

  final PalmeraLocalDatabase _db;
  final Uuid _uuid;
  final Future<void> Function()? _flush;

  Future<void> enqueue(String outletId, SyncQueueType type, Map<String, dynamic> payload) {
    // ID unik selalu — jangan coalesce dengan INSERT OR REPLACE (hindari race delete/upsert).
    return _db.enqueueSync(
      id: 'sync_${type.name}_${_uuid.v4()}',
      outletId: outletId,
      type: type,
      payload: jsonEncode(payload),
    );
  }

  /// Enqueue lalu segera flush — wajib untuk penghapusan (tanpa sync manual).
  Future<void> enqueueAndFlush(
    String outletId,
    SyncQueueType type,
    Map<String, dynamic> payload,
  ) async {
    await enqueue(outletId, type, payload);
    await flushNow();
  }

  /// Flush antrean sekarang (setelah beberapa enqueue hapus berantai).
  Future<void> flushNow() async {
    final flush = _flush;
    if (flush != null) await flush();
  }
}

final syncEnqueueProvider = Provider<SyncEnqueue>((ref) {
  return SyncEnqueue(
    ref.watch(localDatabaseProvider),
    ref.watch(uuidProvider),
    flush: () => ref.read(syncWorkerProvider).flush(),
  );
});
