/**
 * SCORM 1.2 Standard API Wrapper
 * Implements LMS communication with robust window & parent discovery.
 */
var nFindAPITries = 0;
var maxTries = 500;
var scormAPI = null;

function ScanForAPI(win) {
  while (win.API == null && win.parent != null && win.parent != win) {
    nFindAPITries++;
    if (nFindAPITries > maxTries) return null;
    win = win.parent;
  }
  return win.API;
}

function GetAPI(win) {
  if (win.parent != null && win.parent != win) {
    scormAPI = ScanForAPI(win.parent);
  }
  if (scormAPI == null && win.opener != null) {
    scormAPI = ScanForAPI(win.opener);
  }
  return scormAPI;
}

function ScormProcessInitialize() {
  scormAPI = GetAPI(window);
  if (scormAPI == null) {
    console.log("[SCORM] No LMS API found. Running in Standalone / Preview Mode.");
    return false;
  }
  var result = scormAPI.LMSInitialize("");
  console.log("[SCORM] LMSInitialize:", result);
  scormAPI.LMSSetValue("cmi.core.lesson_status", "incomplete");
  scormAPI.LMSCommit("");
  return result === "true";
}

function ScormGetSuspendData() {
  if (!scormAPI) {
    try { return localStorage.getItem("scorm_suspend_data") || ""; } catch(e) { return ""; }
  }
  try {
    return scormAPI.LMSGetValue("cmi.suspend_data") || "";
  } catch (e) {
    console.error("[SCORM] Error getting suspend_data:", e);
    return "";
  }
}

function ScormSetSuspendData(dataStr) {
  if (!scormAPI) {
    try { localStorage.setItem("scorm_suspend_data", dataStr); } catch(e) {}
    return;
  }
  try {
    scormAPI.LMSSetValue("cmi.suspend_data", dataStr);
    scormAPI.LMSCommit("");
  } catch (e) {
    console.error("[SCORM] Error setting suspend_data:", e);
  }
}

function ScormGetLessonLocation() {
  if (!scormAPI) {
    try { return localStorage.getItem("scorm_lesson_location") || ""; } catch(e) { return ""; }
  }
  try {
    return scormAPI.LMSGetValue("cmi.core.lesson_location") || "";
  } catch (e) {
    return "";
  }
}

function ScormSetLessonLocation(locStr) {
  if (!scormAPI) {
    try { localStorage.setItem("scorm_lesson_location", locStr); } catch(e) {}
    return;
  }
  try {
    scormAPI.LMSSetValue("cmi.core.lesson_location", locStr);
    scormAPI.LMSCommit("");
  } catch (e) {}
}

function ScormRecordScoreAndStatus(score, isFullyCompleted) {
  if (!scormAPI) return;
  try {
    if (score !== null && score !== undefined) {
      scormAPI.LMSSetValue("cmi.core.score.raw", score.toString());
      scormAPI.LMSSetValue("cmi.core.score.min", "0");
      scormAPI.LMSSetValue("cmi.core.score.max", "100");
    }
    var status = isFullyCompleted ? "passed" : "incomplete";
    scormAPI.LMSSetValue("cmi.core.lesson_status", status);
    scormAPI.LMSCommit("");
    console.log("[SCORM] Score & Status Recorded:", score, status);
  } catch (e) {
    console.error("[SCORM] Error recording score:", e);
  }
}

function ScormProcessFinish() {
  if (!scormAPI) return;
  scormAPI.LMSCommit("");
  scormAPI.LMSFinish("");
  console.log("[SCORM] LMSFinish executed.");
}

window.addEventListener("beforeunload", function() {
  ScormProcessFinish();
});
