// Note that this DOM parser heavily depends on the layout of https://web.telegram.org/#/im
// and is not robust at all!!
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.text && msg.text === 'getMessages' && !msg.oppName.includes('?')) {
    // oppName: friend id
    // messageNumber: number of currently lodaded messages
    // messages: parsed messages with source and time info
    const peer = document.querySelector(".im_history_messages_peer:not(.ng-hide)");
    sendResponse({
      oppName: msg.oppName,
      messageNumber: peer.querySelectorAll(".im_history_message_wrap").length,
      messages: Array.from(peer.querySelectorAll(".im_message_outer_wrap,.im_message_date_split")).map((n) => {
        if (n.className.includes('im_message_outer_wrap')) {
          const isIn = !!n.querySelector('.im_message_in');
          const nd = n.querySelector('.im_message_date_text');
          if (!nd) return undefined;
          const d = Date.parse("1970-01-01 " + nd.getAttribute('data-content'));
          // A regular message
          return {
            // The message should either come from friend (opp) or the user (self)
            source: isIn ? 'opp' : 'self',
            type: 'msg',
            time: d,
            nx: nd.getAttribute('data-content'),
          };
        } else {
          const nd = n.querySelector('.im_message_date_split_text');
          const d = Date.parse(nd.innerText + " Z");
          // Separator usually means the start of a convo session
          return {
            type: 'separator',
            time: d,
          };
        }
      }),
    });
  }
});
