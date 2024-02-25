<template>
    <div class="recently-played-list-modal">
        <h1>Recently Played</h1>
        <div class="scroll-container" ref="scrollRef">
            <div v-for="(play, index) in recentlyPlayed" :key="index" class="play-item">
                <img :src="play.albumCoverUrl" alt="Album Cover" class="album-cover" />
                <div class="song-info">
                    <h3>{{ play.songTitle }}</h3>
                    <p>{{ play.artistName }} - {{ play.albumName }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script lang="ts">
import { ref, onMounted, Ref } from 'vue';
import { Song } from '../types/Song';

export default {
    name: 'RecentlyPlayedList',
    setup() {
        const recentlyPlayed = ref<Song[]>([

            {
                songTitle: 'Song One',
                artistName: 'Artist One',
                albumName: 'Album One',
                albumCoverUrl: 'https://via.placeholder.com/50',
            },
            {
                songTitle: 'Song Two',
                artistName: 'Artist Two',
                albumName: 'Album Two',
                albumCoverUrl: 'https://via.placeholder.com/50',
            },
            {
                songTitle: 'Song Three',
                artistName: 'Artist Three',
                albumName: 'Album Three',
                albumCoverUrl: 'https://via.placeholder.com/50',
            },
            {
                songTitle: 'Song Four',
                artistName: 'Artist Four',
                albumName: 'Album Four',
                albumCoverUrl: 'https://via.placeholder.com/50',
            },
            {
                songTitle: 'Song Five',
                artistName: 'Artist Five',
                albumName: 'Album Five',
                albumCoverUrl: 'https://via.placeholder.com/50',
            }
        ]);

        const scrollRef: Ref<HTMLElement | null> = ref(null);

        onMounted(() => {
            const scroll = scrollRef.value;

            if (scroll) {
                let startLeft = 0;
                const step = () => {
                    if (scroll.offsetWidth + startLeft >= scroll.scrollWidth) {
                        startLeft = 0;
                        scroll.scrollLeft = startLeft;
                    } else {
                        startLeft += 0.25;
                        scroll.scrollLeft = startLeft;
                    }
                    requestAnimationFrame(step);
                };

                step();
            }
        });

        return { recentlyPlayed, scrollRef };
    },
};
</script>
  
<style>
.recently-played-list-modal {
    background: rgba(50, 50, 50, 0.6);
    color: aliceblue;
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

.recently-played-list-modal h1 {
    width: 100%;
    text-align: left;
    margin-top: 0;
    margin-bottom: 10px;
}

.scroll-container {
    display: flex;
    align-items: center;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.scroll-container::-webkit-scrollbar {
    display: none;
}

.play-item {
    display: inline-flex;
    align-items: center;
    padding: 10px;
    border-radius: 5px;
    margin-right: 10px;
    height: 60px;
    background: rgba(60, 60, 60, 0.6);
}

.play-item:last-child {
    margin-right: 0;
}

.album-cover {
    width: 50px;
    height: 50px;
    margin-right: 10px;
    border-radius: 3px;
}

.song-info {
    display: flex;
    flex-direction: column;
    margin-right: 5px;
}

.song-info h3,
.song-info p {
    margin: 0;
    color: aliceblue;
}

@media (max-width: 680px) {
    .recently-played-list-modal {
        width: 80vw;
        max-width: none;
    }
}
</style>
  