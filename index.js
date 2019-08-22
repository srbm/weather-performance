/* eslint-disable require-jsdoc */
/* eslint-disable no-invalid-this */
'use strict';

function fetchLeagueTeams() {
  fetch(`http://api.football-data.org/v2/competitions/PL/teams?season=2018`,
      {headers: {'X-Auth-Token': '42b54b95666e4b969e41a0e7361afe71'}})
      .then((response) => {
        response.json().then(response => {
          console.log(response);
          addTeamsToDom(response);
          handleTeamClick();
        });
      });
}
function addTeamsToDom(response) {
  for (let i = 0; i<20; i++) {
    const teamId = response.teams[i].id;
    const teamAddress = response.teams[i].address;
    $('.team:eq('+i+')').data('team-address', teamAddress);
    $('.team:eq('+i+')').data('team-id', teamId);
    $('.team:eq('+i+') img').attr('src', response.teams[i].crestUrl);
    $('.team:eq('+i+')').append(`<h3>${response.teams[i].name}</h3>`);
  }
}

function handleTeamClick() {
  $('.team').on('click', function() {
    const teamId = $(this).data('team-id');
    hideAllTeams();
    changeToWeatherOptions(teamId)
  });
}

function changeToWeatherOptions(teamId) {
  fetchAllTeamMatches(teamId).then(data => {
    // getPLTeamMatchesData(data);
    return getLocationDate(data);
    // determine weather icons
  }).then(weatherCallParams => {
    return getWeathersData(weatherCallParams);
  }).then(weatherChoices  => {
    console.log(weatherChoices);
    // show weather icons
    makeIconDivs(weatherChoices);
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
  return fetch(`http://api.football-data.org/v2/teams/${teamId}/matches?dateFrom=2018-08-10&dateTo=2019-05-12`,
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
  return fetch(`http://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/9f2b441e09bacb0213aaa8eab1f74725/${paramsArr[i].lat},${paramsArr[i].long},${paramsArr[i].utcDate}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error ("fetch weather unsuccessful");
        }
        return response.json();
      }).catch( (e) => {
        console.error(e);
      });
}

function getWeathersData(paramsArr) {
  const weathersArr = [];
  const weatherChoices = new Set();
  for (let i=0; i < paramsArr.length; i++) {
    returnWeatherPromise(paramsArr, i).then((data) => {
      // console.log(data);
      weathersArr.push(data.currently.icon);
      weatherChoices.add(data.currently.icon)
    });
  }
  return weatherChoices;
}
function makeIconDivs(weatherChoices) {
  console.log(weatherChoices.size);
  weatherChoices.forEach(function(icon) {
    console.log(icon);
    // $('.weathers').append(`<div class="${icon}"><img src="https://picsum.photos/200/300" alt="${icon}"/></div>`);
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
