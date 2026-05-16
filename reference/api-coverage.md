# Pega DX API v25.1.2 — Coverage Matrix

Generated: 2026-05-16T11:59:49.209Z. Source: `spec/dx-api.yaml`. Total operations: 119.

## Summary

- Implemented: 119 / 119 (100.0%)
- Missing: 0
- Drift: 0

## Endpoint → Command Map

| Method | Path | Command | Source |
|---|---|---|---|
| GET | `/ai-agents` | `pega ai-agents list` | `src/commands/ai-agents/list.ts` |
| GET | `/ai-agents/{agentID}/conversations` | `pega ai-agents list-conversations` | `src/commands/ai-agents/list-conversations.ts` |
| POST | `/ai-agents/{agentID}/conversations` | `pega ai-agents start-conversation` | `src/commands/ai-agents/start-conversation.ts` |
| GET | `/ai-agents/{agentID}/conversations/{conversationID}` | `pega ai-agents get-conversation` | `src/commands/ai-agents/get-conversation.ts` |
| PATCH | `/ai-agents/{agentID}/conversations/{conversationID}` | `pega ai-agents send-message` | `src/commands/ai-agents/send-message.ts` |
| PUT | `/ai-agents/{agentID}/conversations/{conversationID}/close` | `pega ai-agents close-conversation` | `src/commands/ai-agents/close-conversation.ts` |
| PUT | `/ai-agents/{agentID}/conversations/{conversationID}/messages/{messageID}/dislike` | `pega ai-agents dislike` | `src/commands/ai-agents/dislike.ts` |
| PUT | `/ai-agents/{agentID}/conversations/{conversationID}/messages/{messageID}/like` | `pega ai-agents like` | `src/commands/ai-agents/like.ts` |
| GET | `/assignments/{assignmentID}` | `pega assignments get` | `src/commands/assignments/get.ts` |
| GET | `/assignments/{assignmentID}/actions/{actionID}` | `pega assignments get-action` | `src/commands/assignments/get-action.ts` |
| PATCH | `/assignments/{assignmentID}/actions/{actionID}` | `pega assignments perform` | `src/commands/assignments/perform.ts` |
| PATCH | `/assignments/{assignmentID}/actions/{actionID}/recalculate` | `pega assignments recalculate` | `src/commands/assignments/recalculate.ts` |
| PATCH | `/assignments/{assignmentID}/actions/{actionID}/refresh` | `pega assignments refresh-action` | `src/commands/assignments/refresh-action.ts` |
| PATCH | `/assignments/{assignmentID}/actions/{actionID}/save` | `pega assignments save` | `src/commands/assignments/save.ts` |
| PATCH | `/assignments/{assignmentID}/navigation_steps/{stepID}` | `pega assignments navigate-to-step` | `src/commands/assignments/navigate-to-step.ts` |
| PATCH | `/assignments/{assignmentID}/navigation_steps/previous` | `pega assignments navigate-back` | `src/commands/assignments/navigate-back.ts` |
| GET | `/assignments/next` | `pega assignments get-next` | `src/commands/assignments/get-next.ts` |
| GET | `/assistants/{assistantID}/conversations` | `pega assistants list-conversations` | `src/commands/assistants/list-conversations.ts` |
| POST | `/assistants/{assistantID}/conversations` | `pega assistants start-conversation` | `src/commands/assistants/start-conversation.ts` |
| GET | `/assistants/{assistantID}/conversations/{conversationID}` | `pega assistants get-conversation` | `src/commands/assistants/get-conversation.ts` |
| PATCH | `/assistants/{assistantID}/conversations/{conversationID}` | `pega assistants send-message` | `src/commands/assistants/send-message.ts` |
| PUT | `/assistants/{assistantID}/conversations/{conversationID}/close` | `pega assistants close-conversation` | `src/commands/assistants/close-conversation.ts` |
| DELETE | `/attachments/{attachmentID}` | `pega attachments delete` | `src/commands/attachments/delete.ts` |
| GET | `/attachments/{attachmentID}` | `pega attachments get` | `src/commands/attachments/get.ts` |
| PATCH | `/attachments/{attachmentID}` | `pega attachments patch` | `src/commands/attachments/patch.ts` |
| POST | `/attachments/upload` | `pega attachments upload` | `src/commands/attachments/upload.ts` |
| GET | `/authentication-profiles/{authProfileName}` | `pega auth-profiles get` | `src/commands/auth-profiles/get.ts` |
| DELETE | `/authentication-profiles/{authProfileName}/user-tokens` | `pega auth-profiles revoke-tokens` | `src/commands/auth-profiles/revoke-tokens.ts` |
| PATCH | `/cases` | `pega cases bulk-perform` | `src/commands/cases/bulk-perform.ts` |
| POST | `/cases` | `pega cases create` | `src/commands/cases/create.ts` |
| DELETE | `/cases/{caseID}` | `pega cases delete` | `src/commands/cases/delete.ts` |
| GET | `/cases/{caseID}` | `pega cases get` | `src/commands/cases/get.ts` |
| GET | `/cases/{caseID}/actions/{actionID}` | `pega cases get-action` | `src/commands/cases/get-action.ts` |
| PATCH | `/cases/{caseID}/actions/{actionID}` | `pega cases perform-action` | `src/commands/cases/perform-action.ts` |
| PATCH | `/cases/{caseID}/actions/{actionID}/recalculate` | `pega cases recalculate` | `src/commands/cases/recalculate.ts` |
| PATCH | `/cases/{caseID}/actions/{actionID}/refresh` | `pega cases refresh-action` | `src/commands/cases/refresh-action.ts` |
| GET | `/cases/{caseID}/ancestors` | `pega cases list-ancestors` | `src/commands/cases/list-ancestors.ts` |
| GET | `/cases/{caseID}/attachment_categories` | `pega cases list-attachment-categories` | `src/commands/cases/list-attachment-categories.ts` |
| GET | `/cases/{caseID}/attachments` | `pega attachments list` | `src/commands/attachments/list.ts` |
| POST | `/cases/{caseID}/attachments` | `pega attachments add` | `src/commands/attachments/add.ts` |
| GET | `/cases/{caseID}/descendants` | `pega cases list-descendants` | `src/commands/cases/list-descendants.ts` |
| DELETE | `/cases/{caseID}/documents/{documentID}` | `pega documents delete` | `src/commands/documents/delete.ts` |
| GET | `/cases/{caseID}/followers` | `pega followers list` | `src/commands/followers/list.ts` |
| POST | `/cases/{caseID}/followers` | `pega followers add` | `src/commands/followers/add.ts` |
| DELETE | `/cases/{caseID}/followers/{followerID}` | `pega followers delete` | `src/commands/followers/delete.ts` |
| GET | `/cases/{caseID}/participant_roles` | `pega participants list-roles` | `src/commands/participants/list-roles.ts` |
| GET | `/cases/{caseID}/participant_roles/{participant_role_ID}` | `pega participants get-role` | `src/commands/participants/get-role.ts` |
| GET | `/cases/{caseID}/participants` | `pega participants list` | `src/commands/participants/list.ts` |
| POST | `/cases/{caseID}/participants` | `pega participants add` | `src/commands/participants/add.ts` |
| DELETE | `/cases/{caseID}/participants/{participantID}` | `pega participants delete` | `src/commands/participants/delete.ts` |
| GET | `/cases/{caseID}/participants/{participantID}` | `pega participants get` | `src/commands/participants/get.ts` |
| PATCH | `/cases/{caseID}/participants/{participantID}` | `pega participants update` | `src/commands/participants/update.ts` |
| POST | `/cases/{caseID}/processes/{processID}` | `pega cases start-process` | `src/commands/cases/start-process.ts` |
| GET | `/cases/{caseID}/related_cases` | `pega related list` | `src/commands/related/list.ts` |
| POST | `/cases/{caseID}/related_cases` | `pega related add` | `src/commands/related/add.ts` |
| DELETE | `/cases/{caseID}/related_cases/{related_caseID}` | `pega related delete` | `src/commands/related/delete.ts` |
| GET | `/cases/{caseID}/stages` | `pega cases list-stages` | `src/commands/cases/list-stages.ts` |
| PUT | `/cases/{caseID}/stages/{stageID}` | `pega cases stage-go` | `src/commands/cases/stage-go.ts` |
| POST | `/cases/{caseID}/stages/next` | `pega cases stage-next` | `src/commands/cases/stage-next.ts` |
| GET | `/cases/{caseID}/tags` | `pega tags list` | `src/commands/tags/list.ts` |
| POST | `/cases/{caseID}/tags` | `pega tags add` | `src/commands/tags/add.ts` |
| DELETE | `/cases/{caseID}/tags/{tagID}` | `pega tags delete` | `src/commands/tags/delete.ts` |
| DELETE | `/cases/{caseID}/updates` | `pega cases discard-updates` | `src/commands/cases/discard-updates.ts` |
| GET | `/cases/{caseID}/views/{viewID}` | `pega cases get-view` | `src/commands/cases/get-view.ts` |
| POST | `/cases/{caseID}/views/{viewID}/calculated_fields` | `pega cases calc-fields` | `src/commands/cases/calc-fields.ts` |
| PATCH | `/cases/{caseID}/views/{viewID}/refresh` | `pega cases refresh-view` | `src/commands/cases/refresh-view.ts` |
| POST | `/cases/bulk-actions` | `pega cases bulk-actions` | `src/commands/cases/bulk-actions.ts` |
| GET | `/casetypes` | `pega case-types list` | `src/commands/case-types/list.ts` |
| GET | `/casetypes/{caseTypeID}/actions/{actionID}` | `pega case-types get-action` | `src/commands/case-types/get-action.ts` |
| GET | `/channels/{channelID}` | `pega pages channel` | `src/commands/pages/channel.ts` |
| GET | `/components/{componentID}` | `pega static-content component` | `src/commands/static-content/component.ts` |
| GET | `/dashboard/{dashboardID}` | `pega pages dashboard` | `src/commands/pages/dashboard.ts` |
| GET | `/data_objects` | `pega data list-objects` | `src/commands/data/list-objects.ts` |
| GET | `/data_pages` | `pega data list-pages` | `src/commands/data/list-pages.ts` |
| GET | `/data_views/{data_view_ID}` | `pega data get` | `src/commands/data/get.ts` |
| POST | `/data_views/{data_view_ID}` | `pega data query` | `src/commands/data/query.ts` |
| POST | `/data_views/{data_view_ID}/count` | `pega data count` | `src/commands/data/count.ts` |
| GET | `/data_views/{data_view_ID}/metadata` | `pega data get-metadata` | `src/commands/data/get-metadata.ts` |
| POST | `/data_views/{data_view_ID}/metadata` | `pega data query-metadata` | `src/commands/data/query-metadata.ts` |
| POST | `/data_views/{data_view_ID}/views/{view_ID}` | `pega data query-view` | `src/commands/data/query-view.ts` |
| DELETE | `/data/{data_view_ID}` | `pega data delete` | `src/commands/data/delete.ts` |
| PATCH | `/data/{data_view_ID}` | `pega data patch` | `src/commands/data/patch.ts` |
| POST | `/data/{data_view_ID}` | `pega data create` | `src/commands/data/create.ts` |
| PUT | `/data/{data_view_ID}` | `pega data update` | `src/commands/data/update.ts` |
| POST | `/data/{data_view_ID}/actions` | `pega data list-actions` | `src/commands/data/list-actions.ts` |
| PATCH | `/data/{data_view_ID}/actions/{action_ID}` | `pega data perform-action` | `src/commands/data/perform-action.ts` |
| POST | `/data/{data_view_ID}/actions/{action_ID}` | `pega data get-action` | `src/commands/data/get-action.ts` |
| GET | `/documents/{documentID}` | `pega documents get` | `src/commands/documents/get.ts` |
| GET | `/feeds/{feedID}` | `pega social get-feed` | `src/commands/social/get-feed.ts` |
| GET | `/files/{fileID}` | `pega static-content file` | `src/commands/static-content/file.ts` |
| GET | `/insight/{insightID}` | `pega pages insight` | `src/commands/pages/insight.ts` |
| GET | `/localizations/{locale}` | `pega pages localization` | `src/commands/pages/localization.ts` |
| GET | `/mention_types` | `pega social list-mention-types` | `src/commands/social/list-mention-types.ts` |
| GET | `/mentions` | `pega social list-mentions` | `src/commands/social/list-mentions.ts` |
| GET | `/message-types/{type}` | `pega social get-message-type` | `src/commands/social/get-message-type.ts` |
| GET | `/messages` | `pega social list-messages` | `src/commands/social/list-messages.ts` |
| POST | `/messages` | `pega social post-message` | `src/commands/social/post-message.ts` |
| DELETE | `/messages/{messageID}` | `pega social delete-message` | `src/commands/social/delete-message.ts` |
| GET | `/messages/{messageID}` | `pega social get-message` | `src/commands/social/get-message.ts` |
| PUT | `/messages/{messageID}` | `pega social update-message` | `src/commands/social/update-message.ts` |
| DELETE | `/messages/{messageID}/likes` | `pega social unlike-message` | `src/commands/social/unlike-message.ts` |
| GET | `/messages/{messageID}/likes` | `pega social list-likes` | `src/commands/social/list-likes.ts` |
| POST | `/messages/{messageID}/likes` | `pega social like-message` | `src/commands/social/like-message.ts` |
| GET | `/pages/{pageID}` | `pega pages get` | `src/commands/pages/get.ts` |
| POST | `/pages/{pageID}` | `pega pages get-with-context` | `src/commands/pages/get-with-context.ts` |
| GET | `/portals/{portalID}` | `pega pages portal` | `src/commands/pages/portal.ts` |
| GET | `/recents` | `pega recents list` | `src/commands/recents/list.ts` |
| PATCH | `/recents` | `pega recents update` | `src/commands/recents/update.ts` |
| POST | `/refreshB2S` | `pega auth refresh-b2s` | `src/commands/auth/refresh-b2s.ts` |
| GET | `/suggested_tags` | `pega social list-suggested-tags` | `src/commands/social/list-suggested-tags.ts` |
| GET | `/tags` | `pega social search-tags` | `src/commands/social/search-tags.ts` |
| GET | `/ui_lists/{ui_list_ID}/personalizations` | `pega ui-lists list-personalizations` | `src/commands/ui-lists/list-personalizations.ts` |
| POST | `/ui_lists/{ui_list_ID}/personalizations` | `pega ui-lists create-personalization` | `src/commands/ui-lists/create-personalization.ts` |
| DELETE | `/ui_lists/{ui_list_ID}/personalizations/{personalizationID}` | `pega ui-lists delete-personalization` | `src/commands/ui-lists/delete-personalization.ts` |
| PUT | `/ui_lists/{ui_list_ID}/personalizations/{personalizationID}` | `pega ui-lists update-personalization` | `src/commands/ui-lists/update-personalization.ts` |
| PATCH | `/ui_lists/{viewName}/move` | `pega ui-lists move` | `src/commands/ui-lists/move.ts` |
| GET | `/user_settings` | `pega user-settings get` | `src/commands/user-settings/get.ts` |
| PATCH | `/user_settings` | `pega user-settings patch` | `src/commands/user-settings/patch.ts` |
| GET | `/users/{user_ID}/profile-image` | `pega static-content profile-image` | `src/commands/static-content/profile-image.ts` |

## CLI-only commands (informational)

These commands have no direct DX API mapping (auth, diagnostics, etc.).

| Command | Source |
|---|---|
| `pega auth diagnose` | `src/commands/auth/diagnose.ts` |
| `pega auth login` | `src/commands/auth/login.ts` |
| `pega auth ping` | `src/commands/auth/ping.ts` |
| `pega case-types list-bulk-actions` | `src/commands/case-types/list-bulk-actions.ts` |
| `pega skill install` | `src/commands/skill/install.ts` |
| `pega skill list` | `src/commands/skill/list.ts` |
| `pega skill show` | `src/commands/skill/show.ts` |
