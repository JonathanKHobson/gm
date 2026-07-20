(function () {
  var shareLink = document.getElementById("bringFriend");
  var shareStatus = document.getElementById("shareStatus");
  var eventsUrl = "https://jonathankhobson.github.io/gm/events/";

  if (!shareLink || !navigator.share) return;

  shareLink.addEventListener("click", function (event) {
    event.preventDefault();
    navigator.share({
      title: "Upcoming GameMasterKyle events",
      text: "Come play at a GameMasterKyle table with me.",
      url: eventsUrl
    }).then(function () {
      if (shareStatus) shareStatus.textContent = "Event link shared.";
    }).catch(function (error) {
      if (error && error.name === "AbortError") return;
      window.location.href = shareLink.href;
    });
  });
})();
