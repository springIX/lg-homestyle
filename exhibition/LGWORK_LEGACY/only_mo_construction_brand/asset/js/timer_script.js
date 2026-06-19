
        function updateDDayTimer() {

            const targetDate = new Date('2025-08-30T00:00:00');
            const now = new Date();

            const diff = targetDate.getTime() - now.getTime();


            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            const remainingHours = hours % 24;
            const remainingMinutes = minutes % 60;
            const remainingSeconds = seconds % 60;
            
            document.querySelector('.day').textContent = `${days}일`;
            document.querySelector('.hour').textContent = `${String(remainingHours).padStart(2, '0')}시간`;
            document.querySelector('.minute').textContent = `${String(remainingMinutes).padStart(2, '0')}분`;
            document.querySelector('.second').textContent = `${String(remainingSeconds).padStart(2, '0')}초`;
        }
        const timerInterval = setInterval(updateDDayTimer, 1000);
        updateDDayTimer();