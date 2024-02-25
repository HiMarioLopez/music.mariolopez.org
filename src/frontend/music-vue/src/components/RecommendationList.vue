<template>
    <div class="recommendation-list-modal">
        <h1>Recommendation Backlog</h1>
        <ul>
            <li v-for="(recommendation, index) in recommendations" :key="index" class="recommendation-item">
                <img :src="recommendation.albumCoverUrl" alt="Album Cover" class="album-cover" />
                <div class="song-info">
                    <h3>{{ recommendation.songTitle }}</h3>
                    <p>{{ recommendation.artistName }} - {{ recommendation.albumName }}</p>
                </div>
            </li>
        </ul>
    </div>
</template>
  
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Song } from '../types/Song';

export default defineComponent({
    name: 'RecommendationList',
    props: {
        recommendations: {
            type: Array as PropType<Song[]>,
            required: true,
        },
    },
});
</script>
  
<style>
.recommendation-list-modal {
    background: rgba(50, 50, 50, 0.6);
    color: aliceblue;
    padding: 20px;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.1);
}

.recommendation-list-modal::-webkit-scrollbar {
    width: 12px;
}

.recommendation-list-modal::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
}

.recommendation-list-modal::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    border: 3px solid rgba(0, 0, 0, 0.1);
}

.recommendation-list-modal h1 {
    width: 100%;
    text-align: left;
    margin-top: 0;
    margin-bottom: 10px;
}

.recommendation-list-modal ul {
    list-style-type: none;
    padding-left: 0;
    width: 100%;
    max-height: calc(7 * 60px);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.1);
    margin-top: 0;
    margin-bottom: 0;
}

.recommendation-list-modal li {
    background: rgba(60, 60, 60, 0.6);
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
}

.recommendation-list-modal li:last-child {
    margin-bottom: 0;
}

.recommendation-list-modal li:hover {
    background: rgba(75, 75, 75, 0.7);
}

.album-cover {
    width: 50px;
    height: 50px;
    margin-right: 10px;
    border-radius: 3px;
}

.recommendation-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 10px;
    height: 60px;
    margin-right: 7px;
}

.recommendation-item:last-child {
    margin-bottom: 0;
}

.song-info {
    display: flex;
    flex-direction: column;
}

.song-info h3,
.song-info p {
    margin: 0;
    color: aliceblue;
}

@media (max-width: 680px) {
    .recommendation-list-modal {
        width: 80vw;
        max-width: none;
    }
}
</style>
  