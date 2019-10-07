'use strict';
const STATE = {
};
const stateRenders = {
  initial: watchInitialPage,
  pickedTeam: renderWeather,
  pickedWeather: renderResults,
}
const appState = {
  'LeagueMatches' : [],
  'TeamName' : '',
};
function updateState(to) {
  STATE[to] = appState;
  return stateRenders[to]();
}
function renderWeather() {
  const team = STATE.pickedTeam;
  const html = `<img src="${appState.iconURL}" alt="${team.teamName}" />`;
  $('.state__team').html(html);
  $('.teams, .state__weather, .results').hide();
  $('.weathers, .selections__header').show();
  addBackBtn('pickedTeam', 'initial');
}
function renderResults() {
  const weather = STATE.pickedWeather;
  const html = `<div class="weather">
                  <i class="${appState.weatherIcon}" alt="${weather.weatherPicked}"></i>
                  </div>`;
  $('.state__weather').html(html);
  $('.teams, .weathers').hide();
  $('.results, .state__weather').show();
  addBackBtn('pickedWeather', 'pickedTeam');
}

function addBackBtn(from, to) {
  const backBtn = $('<button>Go Back</button>');
  backBtn.click(() => {
    delete STATE[from];
    $('.state__btn, .state__team').empty();
    stateRenders[to]();
  });
  $('.state__btn').html(backBtn);
}
// End State functions


function watchInitialPage() {
  $('.selections__header').html('Select a team.');
  $('.state').hide();
  $('.weathers, .teams, .results').hide().empty();
  $('.lds-spinner').show();
  fetchLeagueTeams()
    .then(handleFetchResponse)
    .then(json => {
      addTeamsToDom(json);
      $('.teams').show();
    })
    .catch(e => {
      console.log(e + '; watchInitialPage ');
      handleError(e);
    })
    .finally(() => {
      $('.lds-spinner').hide();
    });
}
function addTeamsToDom(response) {
  for (let i = 0; i<20; i++) {
    const teamId = response.teams[i].id;
    const teamName = response.teams[i].name;
    const url = checkHTTPS(response.teams[i].crestUrl);
    $('.teams').append(`<div class="team" tabindex=0><img></img><h3></h3></div>`);
    $('.team:eq('+i+')').data('team-name', teamName);
    $('.team:eq('+i+')').data('team-id', teamId);
    $('.team:eq('+i+') img').attr('src', url);
    $('.team:eq('+i+') img').attr('alt', teamName);
    $('.team:eq('+i+') h3').html(`${teamName}`);
  }
  $('.team img').on('load', () => {
    $('.team').css('display', 'flex');
  });
}
function checkHTTPS(url) {
  if(url.match('^http:')) {
    return url.replace(/^http:\/\//i, 'https://');
  } else {
    return url;
  }
}
function watchTeamClick() {
  $('.teams').on('click', '.team', function() {
    const teamId = $(this).data('team-id');
    appState.TeamName = $(this).data('team-name');
    appState.iconURL = $(this).children('img').attr('src');
    handleTeamClick(teamId);
    updateState('pickedTeam');
  });
}
function handleTeamClick(teamId) {
  $('.teams').hide();
  $('.selections__header').html('Select a weather condition');
  changeToWeatherOptions(teamId);
}
function changeToWeatherOptions(teamId) {
  toggleSpinner();
  fetchAllTeamMatches(teamId)
    .then(handleFetchResponse)
    .then(getWeatherCallParams)
    .then(getWeatherData)
    .then(addWeatherOptions)
    .catch(e => {
      console.log(e + '; --changeToWeatherOptions');
      handleError(e);
    })
    .finally(toggleSpinner);
}
function getWeatherCallParams(data) {
  const weatherCallsParams = [];
  const leagueMatches = getPLTeamMatchesData(data);
  appState.LeagueMatches = getPLTeamMatchesData(data);
  const homeTeamPerMatch = getGameHomeTeam(leagueMatches);
  makeWeatherCallParamsObj(leagueMatches, homeTeamPerMatch, weatherCallsParams);
  return weatherCallsParams;
}
function getGameHomeTeam(matches) {
  const homeTeams = [];
  matches.forEach( ele => {
    homeTeams.push(ele.homeTeam);
  });
  return homeTeams;
}
function makeWeatherCallParamsObj(matches, homeTeamsArr, weatherCallsParams) {
  for (let i=0; i<homeTeamsArr.length; i++) {
    GlobalLatLong.forEach( obj => {
      if (homeTeamsArr[i].name === obj.team) {
        weatherCallsParams.push({
          'utcDate': matches[i].utcDate,
          'lat': obj.lat,
          'long': obj.long,
        });
      }
    });
  }
}
function getPLTeamMatchesData(data) {
  return data.matches.filter(match => match.competition.name === "Premier League");
}
function getWeatherData(paramsArr) {
  const weathersPromArr = [];
  for (let i=0; i < paramsArr.length; i++) {
    weathersPromArr.push(fetchWeather(paramsArr, i));
  }
  return Promise.all(weathersPromArr)
      .then(arr => {
        const promArr = [];
        arr.forEach(item => {
          promArr.push(item.json());
        });
        return Promise.all(promArr);
      });
}

function addWeatherOptions(data) {
  const weatherChoices = new Set();
  const weatherPerGame = [];
  data.forEach(item => {
    weatherChoices.add(item.currently.icon);
    weatherPerGame.push(item.currently);
  });
  displayIconDivs(weatherChoices);
  watchWeatherPicked(weatherPerGame);
}

function displayIconDivs(weatherChoices) {
  const weathersSection = $('.weathers');
  $('.state').show();
  if (weathersSection.html()) {
    weathersSection.empty();
  }
  weatherChoices.forEach(function(icon) {
    const header = formatWeatherHeader(icon);
    weathersSection.append(`<div class="weather" tabindex=0>
                            <i class="wi wi-forecast-io-${icon}" alt="${icon}"/></i>
                              <p>${header}</p>
                          </div>`);
  });
  weathersSection.show();
}
function watchWeatherPicked(allWeather) {
  $('.weathers').on('click', '.weather', function() {
    const weatherPicked = $(this).children().attr('alt');
    appState.weatherPicked = weatherPicked;
    appState.weatherIcon = $(this).children().attr('class');
    const pickedWeatherDates = getPickedWeatherDates(allWeather, weatherPicked);
    getMatchesFromWeatherDates(pickedWeatherDates, appState.LeagueMatches, weatherPicked);
    updateState('pickedWeather');
  });
}
function getPickedWeatherDates(allWeather, weatherPicked) {
  const pickedWeatherDates = [];
  allWeather.forEach(item => {
    if (weatherPicked === item.icon) {
      const date = new Date(item.time*1000).getTime();
      pickedWeatherDates.push(date);
    }
  });
  return pickedWeatherDates;
}
function getMatchesFromWeatherDates(pickedWeatherDates, leagueMatches, weatherPicked) {
  const weatherMatchedMatches = [];
  const weatherRecordObj = {'wins': 0, 'losses': 0, 'draws': 0};
  const totalRecordObj = {'wins': 0, 'losses': 0, 'draws': 0};
  const totalGoals = {'goalsFor': 0, 'goalsAgainst': 0};
  const weatherGoals = {'goalsFor': 0, 'goalsAgainst': 0}
  leagueMatches.forEach(match => {
    winLossCounter(match.homeTeam.name, match.awayTeam.name, match.score.winner, totalRecordObj);
    goalsCounter(match, totalGoals);
    const mDate = new Date(match.utcDate).getTime();
    for (let i = 0; i<pickedWeatherDates.length; i++) {
      if (mDate == pickedWeatherDates[i]) {
        winLossCounter(match.homeTeam.name, match.awayTeam.name, match.score.winner, weatherRecordObj);
        goalsCounter(match, weatherGoals);
        weatherMatchedMatches.push({
          'homeTeam': match.homeTeam.name,
          'awayTeam': match.awayTeam.name,
          'score': match.score.fullTime});
      }
    }
  });
  displayWeatherMatchedResults(weatherMatchedMatches, weatherPicked, totalRecordObj, totalGoals, weatherRecordObj, weatherGoals);
}
function winLossCounter(homeTeam, awayTeam, winner, obj) {
  if (homeTeam === appState.TeamName && winner === 'HOME_TEAM') {
    obj.wins++;
  } else if (awayTeam === appState.TeamName && winner ==='AWAY_TEAM') {
    obj.wins++;
  } else if (homeTeam === appState.TeamName && winner === 'AWAY_TEAM') {
    obj.losses++;
  } else if (awayTeam === appState.TeamName && winner === 'HOME_TEAM') {
    obj.losses++;
  } else {
    obj.draws++;
  }
  return obj;
}
function goalsCounter(match, goalsObj) {
  if (match.homeTeam.name === appState.TeamName) {
    goalsObj.goalsFor += match.score.fullTime.homeTeam;
    goalsObj.goalsAgainst += match.score.fullTime.awayTeam;
  } else {
    goalsObj.goalsAgainst += match.score.fullTime.homeTeam;
    goalsObj.goalsFor += match.score.fullTime.awayTeam;
  }
}
function displayWeatherMatchedResults(weatherMatchedMatches, weatherPicked, record, totalGoals, weatherRecord, weatherGoals) {
  $('.selections__header').hide();
  $('.results').html(`
    <table>
      <tr>
        <th class="results__item results__item--title">Stat</th>
        <th class="results__item results__item--title">2018-19 Season</th>
        <th class="results__item results__item--title">${formatWeatherHeader(appState.weatherPicked)}</th>
      </tr>
      <tr>
        <td class="results__item">Record</td>
        <td class="results__item">${record.wins}-${record.losses}-${record.draws}</td>
        <td class="results__item">${weatherRecord.wins}-${weatherRecord.losses}-${weatherRecord.draws}</td>
      </tr>
      <tr>
        <td class="results__item">Win percent</td>
        <td class="results__item">${(record.wins / (record.wins + record.losses + record.draws)).toFixed(3)}</td>
        <td class="results__item">${(weatherRecord.wins / (weatherRecord.wins + weatherRecord.losses + weatherRecord.draws)).toFixed(3)}</td>
      </tr>
      <tr>
        <td class="results__item">Goals For</td>
        <td class="results__item">${totalGoals.goalsFor}</td>
        <td class="results__item">${weatherGoals.goalsFor}</td>
      </tr>
      <tr>
        <td class="results__item">GF/Game</td>
        <td class="results__item">${(totalGoals.goalsFor / (record.wins + record.losses + record.draws)).toFixed(2)}</td>
        <td class="results__item">${(weatherGoals.goalsFor / (weatherRecord.wins + weatherRecord.losses + weatherRecord.draws)).toFixed(2)}</td>
      </tr>
      <tr>
        <td class="results__item">Goals Against</td>
        <td class="results__item">${totalGoals.goalsAgainst}</td>
        <td class="results__item">${weatherGoals.goalsAgainst}</td>
      </tr>
      <tr>
        <td class="results__item">GA/Game</td>
        <td class="results__item">${(totalGoals.goalsAgainst / (record.wins + record.losses + record.draws)).toFixed(2)}</td>
        <td class="results__item">${(weatherGoals.goalsAgainst / (weatherRecord.wins + weatherRecord.losses + weatherRecord.draws)).toFixed(2)}</td>
      </tr>
    </table>
      `);
  $('.weathers').hide();
}

function capitalize(word) {
  const wordArr = word.split('');
  wordArr[0] = wordArr[0].toUpperCase();
  return wordArr.join('');
}
function formatWeatherHeader(weather) {
  return weather.split('-').map(capitalize).join(' ');
}

function fetchLeagueTeams() {
  return fetch(`https://api.football-data.org/v2/competitions/PL/teams?season=2018`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71',
      }});
}
function fetchAllTeamMatches(teamId) {
  return fetch(`https://api.football-data.org/v2/teams/${teamId}/matches?dateFrom=2018-08-10&dateTo=2019-05-12`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71'}});
}
function fetchWeather(paramsArr, i) {
  return fetch(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/9f2b441e09bacb0213aaa8eab1f74725/${paramsArr[i].lat},${paramsArr[i].long},${paramsArr[i].utcDate}`);
}
function handleFetchResponse(fetchedPromise) {
  return fetchedPromise.json()
      .then(json => {
        if (fetchedPromise.ok) {
          return Promise.resolve(json);
        } else {
          throw Error(fetchedPromise);
        }
      });
}
function handleError(err) {
  $('.errors').append(`<p>The request has failed due to too many requests. Please try again later.</p>`).show();
  $('button, .state, .selections__header, .teams, .weathers, .results').hide();
}

function toggleSpinner() {
  $('.lds-spinner').toggle();
}

const GlobalLatLong = [
  {'team': 'Arsenal FC',
    'lat': 51.555089,
    'long': -0.107891},
  {'team': 'Chelsea FC',
    'lat': 51.481863,
    'long': -0.190624},
  {'team': 'Everton FC',
    'lat': 53.438901,
    'long': -2.965648},
  {'team': 'Fulham FC',
    'lat': 51.475148,
    'long': -0.221319},
  {'team': 'Liverpool FC',
    'lat': 53.430964,
    'long': -2.960283},
  {'team': 'Manchester City FC',
    'lat': 53.483317,
    'long': -2.199698},
  {'team': 'Manchester United FC',
    'lat': 53.464029,
    'long': -2.297202},
  {'team': 'Newcastle United FC',
    'lat': 54.975667,
    'long': -1.621045},
  {'team': 'Tottenham Hotspur FC',
    'lat': 51.604419,
    'long': -0.066070},
  {'team': 'Wolverhampton Wanderers FC',
    'lat': 52.590351,
    'long': -2.129709},
  {'team': 'Burnley FC',
    'lat': 53.789144,
    'long': -2.229509},
  {'team': 'Leicester City FC',
    'lat': 52.620607,
    'long': -1.141538},
  {'team': 'Southampton FC',
    'lat': 50.905842,
    'long': -1.390942},
  {'team': 'Watford FC',
    'lat': 51.650020,
    'long': -0.401478},
  {'team': 'Crystal Palace FC',
    'lat': 51.398222,
    'long': -0.085411},
  {'team': 'Huddersfield Town AFC',
    'lat': 53.654346,
    'long': -1.768195},
  {'team': 'Brighton & Hove Albion FC',
    'lat': 50.861640,
    'long': -0.083673},
  {'team': 'West Ham United FC',
    'lat': 51.538736,
    'long': -0.016583},
  {'team': 'Cardiff City FC',
    'lat': 51.472849,
    'long': -3.202991},
  {'team': 'AFC Bournemouth',
    'lat': 50.735237,
    'long': -1.838276},
];

$(watchInitialPage);
$(watchTeamClick);
