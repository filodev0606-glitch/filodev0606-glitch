import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../core/constants/enums.dart';
import '../datasources/local/palmera_local_database.dart';
import '../repositories/repository_providers.dart';

class SyncQueue {
  SyncQueue(this._db, this._uuid);
  final PalmeraLocalDatabase _db;
  final Uuid _uuid;

  Future<void> enqueue({
    required String outletId,
    required SyncQueueType type,
    required String payload,
  }) async {
    await _db.enqueueSync(id: _uuid.v4(), outletId: outletId, type: type, payload: payload);
  }

  Future<List<Map<String, Object?>>> getPending(String outletId) =>
      _db.getPendingSyncItems(outletId);

  Future<List<Map<String, Object?>>> getAllPending() =>
      _db.getAllPendingSyncItems();

  Future<void> markComplete(String id) => _db.markSyncComplete(id);
  Future<void> markFailed(String id, int retry) => _db.markSyncFailed(id, retry);
  Future<void> markAbandoned(String id, int retry) => _db.markSyncAbandoned(id, retry);

  Future<void> requeueFailed({String? outletId}) =>
      _db.requeueFailedSyncItems(outletId: outletId);
}

final syncQueueProvider = Provider<SyncQueue>((ref) {
  return SyncQueue(ref.watch(localDatabaseProvider), ref.watch(uuidProvider));
});
