import 'dart:convert';
import 'package:http/http.dart' as http;

// Core Firebase HTTPS callable proxies centralized here. Each function uses
// standard timeouts and returns parsed maps/lists.

// ---------------- Home / Announcements ----------------
Future<List<Map<String, String>>> fetchAnnouncements({
  http.Client? client,
}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/getGeneralAnnouncementsNew?t=${DateTime.now().millisecondsSinceEpoch}',
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 10));
  if (resp.statusCode != 200) throw Exception('Failed to load announcements');
  final body = json.decode(resp.body);
  // parsing lives in UI utils for now; callers should parse there.
  if (body is Map && body['data'] is List) {
    final List data = body['data'];
    return data.map<Map<String, String>>((e) {
      if (e is Map) {
        final title = (e['title'] ?? '').toString();
        final content = (e['content'] ?? '').toString();
        return {'title': title, 'body': content};
      }
      return {'title': '', 'body': ''};
    }).toList();
  }
  return <Map<String, String>>[];
}

Future<String?> fetchVerseOfDay({http.Client? client}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/getVerseOfDay?t=${DateTime.now().millisecondsSinceEpoch}',
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 10));
  if (resp.statusCode != 200) throw Exception('Failed to load verse');
  final body = json.decode(resp.body);
  if (body is Map && body['data'] is Map) {
    final data = body['data'] as Map;
    final v = data['verseOfDay'];
    return v?.toString();
  }
  return null;
}

Future<Map<String, dynamic>> fetchSpiritMeters({http.Client? client}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/getSpiritMeters?t=${DateTime.now().millisecondsSinceEpoch}',
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 10));
  if (resp.statusCode != 200) throw Exception('Failed to load spirit meters');
  final body = json.decode(resp.body);
  if (body is Map && body['data'] is Map) {
    return Map<String, dynamic>.from(body['data'] as Map);
  }
  return <String, dynamic>{};
}

Future<int?> fetchDayNumber({http.Client? client}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/getDayNumberNew?t=${DateTime.now().millisecondsSinceEpoch}',
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 10));
  if (resp.statusCode != 200) throw Exception('Failed to load day number');
  final body = json.decode(resp.body);
  if (body is Map && body['data'] is Map) {
    final data = body['data'] as Map;
    final dn = data['dayNumber'];
    if (dn is int) return dn;
    if (dn is String) return int.tryParse(dn);
  }
  return null;
}

Future<String?> fetchAnnouncementFormUrl({http.Client? client}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/getAnnouncementFormUrl?t=${DateTime.now().millisecondsSinceEpoch}',
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 10));
  if (resp.statusCode != 200) throw Exception('Failed to load form url');
  final body = json.decode(resp.body);
  if (body is Map && body['data'] is Map) {
    final data = body['data'] as Map;
    final fu = data['formUrl'];
    return fu?.toString();
  }
  return null;
}

// ---------------- Song Requests ----------------
/// Fetch the list of songs for the current user (UUID required for auth).
/// Formerly named fetchSongsNew during the 2025-09 migration; the legacy
/// unauthenticated fetchSongs() has been removed.
Future<List<Map<String, dynamic>>> fetchSongs({
  required String userUuid,
  http.Client? client,
}) async {
  if (userUuid.isEmpty) {
    throw Exception('Missing user UUID');
  }
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/getSongsNew?userUuid=$userUuid&t=${DateTime.now().millisecondsSinceEpoch}',
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 12));
  if (resp.statusCode != 200) {
    try {
      final parsed = json.decode(resp.body);
      final msg = parsed is Map && parsed['error'] != null
          ? parsed['error'].toString()
          : resp.body.toString();
      throw Exception(msg);
    } catch (_) {
      throw Exception('Failed to load songs');
    }
  }
  final body = json.decode(resp.body);
  if (body is Map && body['data'] is List) {
    final list = body['data'] as List;
    return list
        .map((e) => Map<String, dynamic>.from(e as Map<String, dynamic>))
        .toList();
  }
  return <Map<String, dynamic>>[];
}

Future<Map<String, dynamic>> submitSong({
  required String artist,
  required String name,
  // 2025-09 migration: backend now authenticates via user doc UUID instead of email.
  // Field renamed from creatorEmail -> creatorUuid to call addSongNew.
  required String creatorUuid,
  http.Client? client,
}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/addSongNew',
  );
  final body = json.encode({
    'artist': artist,
    'name': name,
    'creatorUuid': creatorUuid,
  });
  final resp = await client
      .post(url, headers: {'Content-Type': 'text/plain'}, body: body)
      .timeout(const Duration(seconds: 20));
  if (resp.statusCode != 200) {
    try {
      final parsed = json.decode(resp.body);
      final msg = parsed is Map && parsed['error'] != null
          ? parsed['error'].toString()
          : resp.body.toString();
      throw Exception(msg);
    } catch (_) {
      throw Exception(resp.body.toString());
    }
  }
  try {
    final parsed = json.decode(resp.body);
    if (parsed is Map && parsed['data'] is Map) {
      final data = parsed['data'] as Map;
      if (data['song'] is Map) {
        return Map<String, dynamic>.from(data['song'] as Map);
      }
      return Map<String, dynamic>.from(data);
    }
    throw Exception('Unexpected response from addSongNew: ${resp.body}');
  } catch (e) {
    throw Exception('Failed to parse addSongNew response: ${e.toString()}');
  }
}

Future<Map<String, dynamic>> upvoteSong({
  required String songId,
  // 2025-09 migration: backend now authenticates via user doc UUID instead of email.
  // Field renamed from userEmail -> userUuid to call upvoteSongNew.
  required String userUuid,
  http.Client? client,
}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/upvoteSongNew',
  );
  final body = json.encode({'songId': songId, 'userUuid': userUuid});
  final resp = await client
      .post(url, headers: {'Content-Type': 'text/plain'}, body: body)
      .timeout(const Duration(seconds: 20));
  if (resp.statusCode != 200) {
    try {
      final parsed = json.decode(resp.body);
      final msg = parsed is Map && parsed['error'] != null
          ? parsed['error'].toString()
          : resp.body.toString();
      throw Exception(msg);
    } catch (_) {
      throw Exception(resp.body.toString());
    }
  }
  try {
    final parsed = json.decode(resp.body);
    if (parsed is Map && parsed['data'] is Map) {
      return Map<String, dynamic>.from(parsed['data'] as Map);
    }
    return <String, dynamic>{};
  } catch (e) {
    throw Exception('Failed to parse upvoteSongNew response: ${e.toString()}');
  }
}

/// 2025-09 migration: deleteSongNew requires songId + userUuid.
Future<Map<String, dynamic>> deleteSongNew({
  required String songId,
  required String userUuid,
  http.Client? client,
}) async {
  if (songId.isEmpty) throw Exception('Missing songId');
  if (userUuid.isEmpty) throw Exception('Missing userUuid');
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/deleteSongNew',
  );
  final body = json.encode({'songId': songId, 'userUuid': userUuid});
  final resp = await client
      .post(url, headers: {'Content-Type': 'text/plain'}, body: body)
      .timeout(const Duration(seconds: 20));
  if (resp.statusCode != 200) {
    try {
      final parsed = json.decode(resp.body);
      final msg = parsed is Map && parsed['error'] != null
          ? parsed['error'].toString()
          : resp.body.toString();
      throw Exception(msg);
    } catch (_) {
      throw Exception(resp.body.toString());
    }
  }
  try {
    final parsed = json.decode(resp.body);
    if (parsed is Map && parsed['data'] is Map) {
      return Map<String, dynamic>.from(parsed['data'] as Map);
    }
    return <String, dynamic>{};
  } catch (e) {
    throw Exception('Failed to parse deleteSongNew response: ${e.toString()}');
  }
}

// ---------------- Users (Auth) ----------------
Future<Map<String, dynamic>> getUser({
  required String id,
  required String email,
  required String name,
  http.Client? client,
}) async {
  client ??= http.Client();
  // Build URL with proper encoding for all query parameters.
  final url = Uri.https(
    'us-central1-staugustinechsapp.cloudfunctions.net',
    '/getUser',
    {'id': id, 'email': email, 'name': name},
  );
  final resp = await client.get(url).timeout(const Duration(seconds: 6));
  if (resp.statusCode != 200) {
    try {
      final parsed = json.decode(resp.body);
      final msg = parsed is Map && parsed['error'] != null
          ? parsed['error'].toString()
          : resp.body.toString();
      throw Exception(msg);
    } catch (_) {
      throw Exception(resp.body.toString());
    }
  }
  try {
    final parsed = json.decode(resp.body);
    if (parsed is Map &&
        parsed['data'] is Map &&
        parsed['data']['user'] is Map) {
      return Map<String, dynamic>.from(parsed['data']['user'] as Map);
    }
    throw Exception('Unexpected response from getUser: ${resp.body}');
  } catch (e) {
    throw Exception('Failed to parse getUser response: ${e.toString()}');
  }
}

Future<Map<String, dynamic>> updateUserField({
  required String id,
  required String field,
  required dynamic value,
  http.Client? client,
}) async {
  client ??= http.Client();
  final url = Uri.parse(
    'https://us-central1-staugustinechsapp.cloudfunctions.net/updateUserField',
  );
  final body = json.encode({'id': id, 'field': field, 'value': value});
  final resp = await client
      .post(url, headers: {'Content-Type': 'text/plain'}, body: body)
      .timeout(const Duration(seconds: 8));
  if (resp.statusCode != 200) {
    try {
      final parsed = json.decode(resp.body);
      final msg = parsed is Map && parsed['error'] != null
          ? parsed['error'].toString()
          : resp.body.toString();
      throw Exception(msg);
    } catch (_) {
      throw Exception(resp.body.toString());
    }
  }
  try {
    final parsed = json.decode(resp.body);
    if (parsed is Map &&
        parsed['data'] is Map &&
        parsed['data']['user'] is Map) {
      return Map<String, dynamic>.from(parsed['data']['user'] as Map);
    }
    throw Exception('Unexpected response from updateUserField: ${resp.body}');
  } catch (e) {
    throw Exception(
      'Failed to parse updateUserField response: ${e.toString()}',
    );
  }
}
