function renderAtId(id, text) {
  document.getElementById(id).innerHTML = text;
}

function renderAtAllClasses(className, text) {
  Array.from(document.getElementsByClassName(className)).forEach(function(e) {
    e.innerHTML = text;
  });
}

function formatDate(rawDate) {
  return rawDate / 1000 / 60;
}

function displayCurConvoInfo(e) {
  if (!e) {
    renderAtId('error', 'Oops something went wrong. Please refresh and try again :(');
    return;
  }
  renderAtId('error', '');

  renderAtId('status', 'Out of ' + e.messageNumber + ' most recent messages with ' + e.oppName + ':');
  renderAtAllClasses('name_opp', e.oppName);

  var cntSession = 0;
  var last = -1;
  var base;
  // 0: self, 1: opp
  var totReplyTime = [0, 0];
  var lastReplyTimestamp = [0, 0];
  var totMsgNumber = [0, 0];

  for (var i in e.messages) {
    var m = e.messages[i];
    if (!m) continue;
    // TODO: fix m.time
    if (m.type === 'separator') {
      // A separator means a start of a convo session. Restart timestamp.
      lastReplyTimestamp[0] = 0;
      lastReplyTimestamp[1] = 0;
      last = -1;
      base = m.time;
    } else {
      // Update timestamps otherwise.
      var cur = m.source === 'self' ? 0 : 1;
      totMsgNumber[cur] ++;
      m.time += base;
      while (m.time < lastReplyTimestamp[cur]) m.time += 86400000;
      lastReplyTimestamp[cur] = m.time;
      if (last !== cur) {
        if (lastReplyTimestamp[1 - cur] === 0) {
          continue;
        }
        totReplyTime[cur] += m.time - lastReplyTimestamp[1 - cur];
        cntSession ++;
        last = cur;
      }
    }
  }

  renderAtId('stats_self', formatDate(totReplyTime[0] / cntSession));
  renderAtId('stats_opp', formatDate(totReplyTime[1] / cntSession));

  renderAtId('n_self', totMsgNumber[0]);
  renderAtId('n_opp', totMsgNumber[1]);

  var lastMsg = e.messages[e.messages.length - 1];
  // Expected reply time should be at least as long as the longest reply time of either side.
  renderAtId('suggestion', new Date(lastMsg.time));
  var expectReplyTime = formatDate(lastMsg.time + (totReplyTime[1] / cntSession) - Date.now());

  if (lastMsg.type === 'separator' || expectReplyTime < 0 || totReplyTime[0] > totReplyTime[1]) {
    renderAtId('title', 'YES');
  } else {
    renderAtId('title', 'NO');
    renderAtId('suggestion', 'Maybe in ' + expectReplyTime + ' minutes.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAtId('error', 'Loading...');
  chrome.tabs.query({ active: true, currentWindow: true }, ([{ url, id }]) => {
    // Get friend id from route
    const m = /^https?:\/\/web.telegram.org\/#\/im\?p=(.*)(?:$|&)/.exec(url);
    if (m) {
      chrome.tabs.sendMessage(id, { text: 'getMessages', oppName: m[1] }, displayCurConvoInfo);
    } else {
      renderAtId('error', 'This extension only works for telegram messages.');
    }
  });
});

document.addEventListener('click', function(e){
  if (e.target.href !== undefined) {
    chrome.tabs.create({ url: e.target.href });
  }
});
