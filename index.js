/* eslint-disable require-jsdoc */
/* eslint-disable no-invalid-this */
'use strict';

function fetchLeagueTeams() {
  fetch(`https://api.football-data.org/v2/competitions/PL/teams?season=2018`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71'}})
      .then((response) => {
        response.json().then(response => {
          addTeamsToDom(response);
          handleTeamClick();
          getMatches();
        });
      });
}
function addTeamsToDom(response) {
  for (let i = 0; i<20; i++) {
    const teamId = response.teams[i].id;
    const teamName = response.teams[i].name;
    $('.team:eq('+i+')').data('team-name', teamName);
    $('.team:eq('+i+')').data('team-id', teamId);
    $('.team:eq('+i+') img').attr('src', response.teams[i].crestUrl);
    $('.team:eq('+i+')').append(`<h3>${response.teams[i].name}</h3>`);
  }
}

function handleTeamClick() {
  $('.team').on('click', function() {
    const teamId = $(this).data('team-id');
    hideAllTeams();
    $('.selections__header').html('Select a weather condition');
    changeToWeatherOptions(teamId);
  });
}

function changeToWeatherOptions(teamId) {
  fetchAllTeamMatches(teamId).then(data => {
    // const leagueMatches = getPLTeamMatchesData(data)
    // console.log(leagueMatches);
    return getLocationDate(data);
    // determine and show weather icons
  }).then(weatherCallParams => {
    return getWeathersData(weatherCallParams);
  }).catch(err => console.log(err));
}

function getLocationDate(data) {
  const weatherCallParams = [];
  const matches = getGameHomeTeam(getPLTeamMatchesData(data));
  makeWeatherCallParamsObj(getPLTeamMatchesData(data), matches, weatherCallParams);
  console.log(weatherCallParams);
  return weatherCallParams;
}

function fetchAllTeamMatches(teamId) {
  return fetch(`https://api.football-data.org/v2/teams/${teamId}/matches?dateFrom=2018-08-10&dateTo=2019-05-12`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71'}})
      .then((response) => {
        if (!response.ok) {
          throw new Error ("fetch team matches unsuccessful");
        }
        const rJ = response.json();
        console.log(rJ);
        return rJ;
      }).catch( e => {
        console.error(e);
      });
}

function getPLTeamMatchesData(data) {
  const PLMatches = [];
  for (let i = 0; i<data.count; i++) {
    if (data.matches[i].competition.name === "Premier League") {
      PLMatches.push(data.matches[i]);
    }
  }
  return (PLMatches);
}

function getGameHomeTeam(matches) {
  const location = [];
  matches.forEach( ele => {
    location.push(ele.homeTeam);
  });
  return location;
}

function hideAllTeams() {
  $('.teams').hide();
}

function makeWeatherCallParamsObj(matches, homeTeamArr, WCObj) {
  for (let i=0; i<homeTeamArr.length; i++) {
    latLong.forEach( (j) => {
      if (homeTeamArr[i].name === j.team) {
        WCObj.push({
          'utcDate': matches[i].utcDate,
          'lat': j.lat,
          'long': j.long
        });
      }
    });
  }
}

function returnWeatherPromise(paramsArr, i) {
  return fetch(`https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/9f2b441e09bacb0213aaa8eab1f74725/${paramsArr[i].lat},${paramsArr[i].long},${paramsArr[i].utcDate}`);
}

function getWeathersData(paramsArr) {
  const weathersPromArr = [];
  const weatherChoices = new Set();
  const allWeather = [];
  for (let i=0; i < paramsArr.length; i++) {
    weathersPromArr.push(returnWeatherPromise(paramsArr, i));
  }
  Promise.all(weathersPromArr).then(arr => {
    const promArr = [];
    arr.forEach(item => {
      promArr.push(item.json());
    });
    Promise.all(promArr).then(data => {
      console.log(data);
      data.forEach(item => {
        weatherChoices.add(item.currently.icon);
        allWeather.push(item.currently);
      });
      console.log(allWeather);
      makeIconDivs(weatherChoices);
      getPickedWeatherDates(allWeather);
    });
  });
}
function makeIconDivs(weatherChoices) {
  console.log(weatherChoices);
  weatherChoices.forEach(function(icon) {
    $('.weathers').append(`<div class="weather">
                            <i class="wi wi-forecast-io-${icon}" alt="${icon}"/></i>
                              <p>${icon}</p>
                          </div>`);
  });
}






let LeagueMatches = [];
let TeamName = '';
function getMatches() {
  $('.team').on('click', function() {
    const teamId = $(this).data('team-id');
    TeamName = $(this).data('team-name');
    fetchAllTeamMatches(teamId).then(data => {
      LeagueMatches = getPLTeamMatchesData(data);
      console.log(LeagueMatches);
      return LeagueMatches;
    });
  });
}
function getPickedWeatherDates(allWeather) {
  const pickedWeatherDates = [];
  $('.weathers').on('click', '.weather', function() {
    const weatherPicked = $(this).children().attr('alt');
    console.log(weatherPicked);
    allWeather.forEach(item => {
      if (weatherPicked === item.icon) {
        const date = new Date(item.time*1000).getTime();
        pickedWeatherDates.push(date);
      }
    });
    console.log(pickedWeatherDates);
    console.log(LeagueMatches);
    getMatchesFromWeatherDates(pickedWeatherDates, LeagueMatches, weatherPicked);
  });
}
function getMatchesFromWeatherDates(pickedWeatherDates, leagueMatches, weatherPicked) {
  const weatherMatchedMatches = [];
  const recordObj = {'wins': 0, 'losses': 0, 'draws': 0};
  console.log(leagueMatches);
  leagueMatches.forEach(match => {
    const mDate = new Date(match.utcDate).getTime();
    console.log(mDate);
    console.log(pickedWeatherDates[0]);
    for (let i = 0; i<pickedWeatherDates.length; i++) {
      if (mDate == pickedWeatherDates[i]) {
        winLossCounter(match.homeTeam.name, match.awayTeam.name, match.score.winner, recordObj);
        console.log('dates equal');
        weatherMatchedMatches.push({
          'homeTeam': match.homeTeam.name,
          'awayTeam': match.awayTeam.name,
          'score': match.score.fullTime});
      }
    }
  });
  displayWeatherMatchedMatches(weatherMatchedMatches, weatherPicked, recordObj);
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
function displayWeatherMatchedMatches(weatherMatchedMatches, weatherPicked, record) {
  $('.selections__header').html(`Results for ${TeamName} playing in ${weatherPicked} weather`).after(
      `<h3>Record: ${record.wins}-${record.losses}-${record.draws}</h3>`);
  $('.weathers').hide();
  weatherMatchedMatches.forEach(match => {
    $('.results').append(
        `<div class="result">
          <h4>Home Team: ${match.homeTeam} Score: ${match.score.homeTeam}</h4>
          <h4>Away Team: ${match.awayTeam} Score: ${match.score.awayTeam}</h4>
        </div>`);
  });
}



const latLong = [
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

$(fetchLeagueTeams);
