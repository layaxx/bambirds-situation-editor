/* eslint-disable unicorn/filename-case */
import jsx from "texsaur"

export const cbrDB = () => {
  return (
    <div>
      <h2>CBR Analysis</h2>
      <div class="grid">
        <div>
          <label>Input database.pl</label>
          {/* prettier-ignore */}
          <textarea id="database" rows="10" cols="50">
:- module(cbr_database, [effect/3, shot/3, case/3, case_shape/6, case_hasMaterial/6, case_hasForm/2]).
:- discontiguous cbr_database:effect/3.
:- discontiguous cbr_database:shot/3.
:- discontiguous cbr_database:case/3.
:- discontiguous cbr_database:case_shape/6.
:- discontiguous cbr_database:case_hasMaterial/6.
:- discontiguous cbr_database:case_hasForm/2.
:- discontiguous cbr_database:case_pig/5.
% 2
case_shape(c2ice11,rect, 617.5,293.5,297,[11,27,1.57079633]).
case_hasMaterial(c2ice11,ice,612,280,11,27).
case_hasForm(c2ice11,bar).
effect(c2,c2ice11,moved).
case_shape(c2pig1,ball, 639,300,113,[6]).
case_hasMaterial(c2pig1,pork,635,296,8,8).
case_pig(c2pig1,635,296,8,8).
effect(c2,c2pig1,moved).
shot(s2,600.5224513691651,298.99999999999994).
case(c2,[c2ice11, c2pig1],s2).
% 3
            </textarea>
        </div>
      </div>
    </div>
  )
}
