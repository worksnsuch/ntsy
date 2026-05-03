window.initClock = function() {
    console.log("[Source] clock.js parsed.");
    const clockElement = document.getElementById('real-time-clock');
    const dayElement = document.getElementById('clock-day');
    const dateElement = document.getElementById('clock-date');

    function updateClock() {
      const now = new Date();
      
      // Time
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      if (clockElement) clockElement.textContent = `${hours}:${minutes} ${ampm}`;
      
      // Day and Date
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      if (dayElement) dayElement.textContent = days[now.getDay()];
      if (dateElement) dateElement.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }

    setInterval(updateClock, 1000);
    updateClock();
};
