/* eslint-disable require-jsdoc */
/* eslint-disable no-invalid-this */
'use strict';

let LeagueMatches = [];
let TeamName = '';

function watchInitialPage() {
  fetchLeagueTeams()
      .then(handleFetchResponse)
      .then(json => {
        addTeamsToDom(json);
        watchTeamClick();
        toggleSpinner();
      })
      .catch(e => {
        console.log(e + ' line 42');
        $('.errors').append(`<p>The request failed. ${e}</p>`);
        toggleSpinner();
      });
}
function addTeamsToDom(response) {
  for (let i = 0; i<20; i++) {
    const teamId = response.teams[i].id;
    const teamName = response.teams[i].name;
    $('.team:eq('+i+')').data('team-name', teamName);
    $('.team:eq('+i+')').data('team-id', teamId);
    if (!$('.team:eq('+i+') img').attr('src')) {
      $('.team:eq('+i+') img').attr('src', response.teams[i].crestUrl);
    }
    $('.team:eq('+i+')').append(`<h3>${response.teams[i].name}</h3>`);
  }
  $('.team img').on('load', () => {
    $('.team').css('display', 'flex');
  });
}
function watchTeamClick() {
  $('.team').on('click', function() {
    const teamId = $(this).data('team-id');
    TeamName = $(this).data('team-name');
    handleTeamClick(teamId);
    getMatches(teamId);
  });
}
function handleTeamClick(teamId) {
  hideAllTeams();
  $('.selections__header').html('Select a weather condition');
  changeToWeatherOptions(teamId);
}
function getMatches(teamId) {
  fetchAllTeamMatches(teamId)
      .then(handleFetchResponse)
      .then(data => {
        LeagueMatches = getPLTeamMatchesData(data);
        return LeagueMatches;
      });
}

function changeToWeatherOptions(teamId) {
  toggleSpinner();
  fetchAllTeamMatches(teamId)
      .then(handleFetchResponse)
      .then(getWeatherCallParams)
      .then(getWeatherData)
      .catch(err => {
        console.log(err + ' changeToWeatherOptions')
        $('.weathers').append(`
            <p>Unfortunately the request has failed and the matches didn't load.
             Please refresh to try again.</p>`);
             toggleSpinner();
      });
}
function getWeatherCallParams(data) {
  const weatherCallsParams = [];
  const leageMatches = getPLTeamMatchesData(data);
  const homeTeamPerMatch = getGameHomeTeam(leageMatches);
  makeWeatherCallParamsObj(leageMatches, homeTeamPerMatch, weatherCallsParams);
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
  const PLMatches = [];
  // const totalRecordObj = {'wins': 0, 'losses': 0, 'draws': 0};
  for (let i = 0; i<data.count; i++) {
    if (data.matches[i].competition.name === "Premier League") {
      PLMatches.push(data.matches[i]);
      // winLossCounter(data.matches[i].homeTeam.name, data.matches[i].awayTeam.name, data.matches[i].score.winner, totalRecordObj);
      // console.log(PLMatches);
    }
  }
  console.log(PLMatches);
  return (PLMatches);
}



function getWeatherData(paramsArr) {
  const weathersPromArr = [];
  const weatherChoices = new Set();
  const weatherPerGame = [];
  for (let i=0; i < paramsArr.length; i++) {
    weathersPromArr.push(returnWeatherPromise(paramsArr, i));
  }
  Promise.all(weathersPromArr).then(arr => {
    const promArr = [];
    arr.forEach(item => {
      promArr.push(item.json());
    });
    Promise.all(promArr).then(data => {
      data.forEach(item => {
        weatherChoices.add(item.currently.icon);
        weatherPerGame.push(item.currently);
      });
      displayIconDivs(weatherChoices);
      console.log(weatherPerGame);
      watchWeatherPicked(weatherPerGame);
      // getPickedWeatherDates(allWeather);
      toggleSpinner();
    }).catch(e => {
      console.log(e + ' inside Promise');
      $('.weathers').append(`<p>Sorry, the request has failed. Please wait a minute and refresh to try again.</p>`)
    });
  }).catch(e => {
    console.log(e + ' outside Promise');
    $('.weathers').append(`<p>Sorry, the API failed. Please wait a minute and refresh to try again.</p>`)
  });
}
function displayIconDivs(weatherChoices) {
  console.log(weatherChoices);
  weatherChoices.forEach(function(icon) {
    $('.weathers').append(`<div class="weather">
                            <i class="wi wi-forecast-io-${icon}" alt="${icon}"/></i>
                              <p>${icon}</p>
                          </div>`);
  });
}
function watchWeatherPicked(allWeather) {
  $('.weathers').on('click', '.weather', function() {
    const weatherPicked = $(this).children().attr('alt');
    const pickedWeatherDates = getPickedWeatherDates(allWeather, weatherPicked);
    getMatchesFromWeatherDates(pickedWeatherDates, LeagueMatches, weatherPicked);
  });
}
function getPickedWeatherDates(allWeather, weatherPicked) {
  const pickedWeatherDates = [];
  console.log(weatherPicked);
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
  const goalsObj = {'goalsFor': 0, 'goalsAgainst': 0}
  leagueMatches.forEach(match => {
    const mDate = new Date(match.utcDate).getTime();
    for (let i = 0; i<pickedWeatherDates.length; i++) {
      if (mDate == pickedWeatherDates[i]) {
        winLossCounter(match.homeTeam.name, match.awayTeam.name, match.score.winner, weatherRecordObj);
        goalsCounter(match, goalsObj);
        console.log('dates equal');
        weatherMatchedMatches.push({
          'homeTeam': match.homeTeam.name,
          'awayTeam': match.awayTeam.name,
          'score': match.score.fullTime});
      }
    }
  });
  displayWeatherMatchedResults(weatherMatchedMatches, weatherPicked, weatherRecordObj, goalsObj);
}
function winLossCounter(homeTeam, awayTeam, winner, obj) {
  if(homeTeam === TeamName && winner === 'HOME_TEAM') {
    obj.wins++;
  } else if (awayTeam === TeamName && winner ==='AWAY_TEAM') {
    obj.wins++;
  } else if (homeTeam === TeamName && winner === 'AWAY_TEAM') {
    obj.losses++;
  } else if (awayTeam === TeamName && winner === 'HOME_TEAM') {
    obj.losses++;
  } else {
    obj.draws++;
  }
  return obj;
}
function goalsCounter(match, goalsObj) {
  if (match.homeTeam.name === TeamName) {
    goalsObj.goalsFor += match.score.fullTime.homeTeam;
    goalsObj.goalsAgainst += match.score.fullTime.awayTeam;
  } else {
    goalsObj.goalsAgainst += match.score.fullTime.homeTeam;
    goalsObj.goalsFor += match.score.fullTime.awayTeam;
  }
}
function displayWeatherMatchedResults(weatherMatchedMatches, weatherPicked, record, goals, weatherRecord) {
  $('.selections__header').html(`Results for ${TeamName} playing in ${weatherPicked} weather`).after(
      `<h3>Record: ${record.wins}-${record.losses}-${record.draws}</h3>
      <h3>Total Goals For: ${goals.goalsFor}</h3>
      <h3>Total Goals Against: ${goals.goalsAgainst}</h3>`);
  $('.weathers').hide();
  weatherMatchedMatches.forEach(match => {
    $('.results').append(
        `<div class="result">
          <h4>${match.homeTeam} Score: ${match.score.homeTeam}</h4>
          <h4>${match.awayTeam} Score: ${match.score.awayTeam}</h4>
        </div>`);
  });
}







// Fetch
function fetchLeagueTeams() {
  return fetch(`https://api.football-data.org/v2/competitions/PL/teams?season=2018`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71',
      }});
}
function fetchAllTeamMatches(teamId) {
  return fetch(`https://api.football-data.org/v2/teams/${teamId}/matches?dateFrom=2018-08-10&dateTo=2019-05-12`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71'}});
}
function returnWeatherPromise(paramsArr, i) {
  return fetch(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/9f2b441e09bacb0213aaa8eab1f74725/${paramsArr[i].lat},${paramsArr[i].long},${paramsArr[i].utcDate}`);
}
function handleFetchResponse(fetchedPromise) {
  return fetchedPromise.json()
      .then(json => {
        if (!fetchedPromise.ok) {
          const error = Object.assign({}, json, {
            status: fetchedPromise.status,
            statusText: fetchedPromise.statusText,
          });
          return Promise.reject(error);
        } else {
          return json;
        }
      });
}

function toggleSpinner() {
  $('.lds-spinner').toggle();
}
function hideAllTeams() {
  $('.teams').hide();
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
