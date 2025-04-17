| table_name    | index_name                        | column_names        | is_unique | is_primary |
| ------------- | --------------------------------- | ------------------- | --------- | ---------- |
| attendance    | attendance_event_id_member_id_key | member_id, event_id | true      | false      |
| attendance    | attendance_pkey                   | id                  | true      | true       |
| club_owners   | club_owners_pkey                  | club_id, user_id    | true      | true       |
| club_settings | club_settings_pkey                | club_id             | true      | true       |
| clubs         | clubs_access_code_key             | access_code         | true      | false      |
| clubs         | clubs_pkey                        | id                  | true      | true       |
| events        | events_invite_code_key            | invite_code         | true      | false      |
| events        | events_pkey                       | id                  | true      | true       |
| members       | members_club_id_name_key          | name, club_id       | true      | false      |
| members       | members_club_id_name_unique       | name, club_id       | true      | false      |
| members       | members_member_uuid_unique        | member_uuid         | true      | false      |
| members       | members_pkey                      | id                  | true      | true       |
| profiles      | profiles_pkey                     | id                  | true      | true       |