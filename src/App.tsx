import { useState, useEffect, useRef } from 'react'
import './App.css'

// notes: change arrived_at to assigned_at
// change columns from blue to white
// change treatment_type to treatment_type and make it dropdown
// treatment_types include 1. quick treat 2. multi drug 3. single drug 4. DTU
// color of treatment on nurse schedules are different based on treatment_types

const treatmentTypeColorMap : {[key: string]: string} = {
  QT: "#C9DF8A",
  SD: "#D2B4DE",
  MD: "#FFC0CB",
  DTU: "#7AC2E0",
}

interface Treatment {
  id: number,
  patient_name: string,
  arrived_at: string,
  treatment_type: string,
  complete_by: string,
  assigned_to: number | null,
  x: number | null,
  y: number | null,
  height: number | null,
  width: number | null,
}

interface NurseSchedule {
  id: number,
  name: string,
  treatments: Array<Treatment>,
}

function App() {
  const [treatments, setTreatments] = useState<Array<Treatment>>([]);
  const [idTracker, setIdTracker] = useState(0);
  const nurseSchedules: Array<NurseSchedule> = ["A", "B", "C", "D", "E", "F"].map((nurse, index) => (
    {id: index, name: nurse, treatments: []}
  ))
  const ref = useRef(null);
  const [calendarHeight, setCalendarHeight] = useState(0);

  useEffect(()=> {
    if (ref.current) {
      setCalendarHeight(ref.current["clientHeight"]);
    }
  }, [])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const formData = new FormData(event.target as HTMLFormElement);
    const submittedTreatment = Object.fromEntries(formData);

    if (!submittedTreatment.patient_name) {
      alert("Please enter a valid patient name.");
      return;
    }
    else if (!submittedTreatment.arrived_at) {
      alert("Please enter a valid arrival time.");
      return;
    }
    else if (!submittedTreatment.treatment_type) {
      alert("Please enter a valid treatment_type level.");
      return;
    }
    else if (!submittedTreatment.complete_by) {
      alert("Please enter a valid estimated completion time.");
      return;
    }
    else if (timeStringToNumber(submittedTreatment.arrived_at as string) >= timeStringToNumber(submittedTreatment.complete_by as string)) {
      alert("Patient's Arrival Time cannot be later than their Completion Time");
      return;
    }

    const treatment: Treatment = {
      id: idTracker,
      patient_name: submittedTreatment.patient_name as string,
      arrived_at: submittedTreatment.arrived_at as string,
      treatment_type : submittedTreatment.treatment_type as string,
      complete_by: submittedTreatment.complete_by as string,
      assigned_to: null,
      x: 0,
      y: calculatePlacement(submittedTreatment.arrived_at as string),
      height: calculateHeight(submittedTreatment.arrived_at as string, submittedTreatment.complete_by as string),
      width: 100,
    };
    setTreatments([...treatments, treatment]);
    setIdTracker(idTracker + 1);
  }

  function timeStringToNumber( time: string) {
    const a = time.split(":")
    return 60 * parseInt(a[0]) + parseInt(a[1]);
  }

  function handleDragStart(event: React.DragEvent) {
    event.dataTransfer.setData("text", (event.target as HTMLElement).id)
    // console.log(event.target.id);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const selectedTreatmentId = parseInt(event.dataTransfer.getData("text"));
    const targetNurseId = parseInt((event.target as HTMLElement).id);

    const overlappedTreatmentIds = getTreatmentsWithOverlap(selectedTreatmentId, targetNurseId);
    console.log(overlappedTreatmentIds)
    let counter = -1;

    const copyTreatments = treatments.map((treatment) => {
      if (!isNaN(targetNurseId) && treatment.id === selectedTreatmentId) {
        counter = counter + 1;
        return { ...treatment, assigned_to: targetNurseId, width: 100/(overlappedTreatmentIds.length + 1), x: counter*100/(overlappedTreatmentIds.length+1)};
      } else if (overlappedTreatmentIds.includes(treatment.id)){
        counter = counter + 1;
        return { ...treatment, width: 100/(overlappedTreatmentIds.length + 1), x: counter*100/(overlappedTreatmentIds.length+1) }
      } else {
        return treatment;
      }
    });
    setTreatments(copyTreatments);
    // console.log(copyTreatments);
  }

  function getTreatmentsWithOverlap(treatmentId: number, nurseId: number|null) {
    // with an input treatmentId, return all other treatment ids with overlap with the input id
    const targetTreatment = treatments.find(treatment => treatment.id === treatmentId)!;
    return treatments.filter(treatment => (
      treatment.id !== treatmentId &&
      nurseId && treatment.assigned_to === nurseId &&
      ((timeStringToNumber(targetTreatment.arrived_at as string) > timeStringToNumber(treatment.arrived_at as string) && timeStringToNumber(targetTreatment.arrived_at as string) < timeStringToNumber(treatment.complete_by as string)) ||
      (timeStringToNumber(targetTreatment.complete_by as string) > timeStringToNumber(treatment.arrived_at as string) && timeStringToNumber(targetTreatment.complete_by as string) < timeStringToNumber(treatment.complete_by as string)))
    )).map(treatment => treatment.id);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
  }

  function calculatePlacement(arrived_at: string) {
    // calendar shows 8AM to 8PM for a total of 12 hours
    // if 8AM, then 0px from the top
    // if 8PM, then 999px (entire height of calendar) from the top
    const startBoundary = timeStringToNumber("07:00");
    const endBoundary = timeStringToNumber("21:00");
    return Math.round(((timeStringToNumber(arrived_at) - startBoundary)/(endBoundary-startBoundary))*calendarHeight)
  }

  function calculateHeight(arrived_at: string, complete_by: string) {
    // returns a PERCENTAGE
    // if an event is from 7am-9pm, it takes up 100% height of the div
    const maxHeight = timeStringToNumber("14:00");
    return 100*(timeStringToNumber(complete_by)-timeStringToNumber(arrived_at))/maxHeight
  }

  function removeFromTreatments(treatmentId: number) {
    setTreatments(treatments.filter(treatment => treatment.id !== treatmentId));
  }

  function handleClick(event: React.MouseEvent) {
    removeFromTreatments(parseInt((event.target as HTMLElement).getAttribute("treatment-id")!));
  }

  function handleRemoveTreatmentFromSchedule(event: React.MouseEvent) {
    const targetTreatmentId = parseInt((event.target as HTMLElement).id);
    const targetTreatment = treatments.find(treatment => treatment.id == targetTreatmentId)!;
    const overlappedTreatmentIds = getTreatmentsWithOverlap(targetTreatmentId, targetTreatment.assigned_to);
    let counter = -1;
    const copyTreatments = treatments.map(treatment => {
      if (treatment.id === targetTreatmentId) {
        return {...treatment, assigned_to: null, x: 0, width: 100};
      } else if (overlappedTreatmentIds.includes(treatment.id)) {
        counter = counter + 1;
        return {...treatment, x: 100*counter/overlappedTreatmentIds.length, width: 100/overlappedTreatmentIds.length}
      } else {
        return treatment;
      }
    })
    setTreatments(copyTreatments);
  }

  return (
    <>
      <h1 className="text-3xl font-bold underline">MishManage</h1>
      <br></br>
      <div className='flex flex-row'>
        <div id="treatments" className="">
          <h2 className="text-xl font-bold">Treatments</h2>
          <div className="space-y-4 flex flex-col">
            {treatments.filter((treatment) => treatment.assigned_to === null).map((treatment) => (
              <div className='bg-emerald-500 rounded-lg p-3 text-left' draggable="true" onDragStart={handleDragStart} key={treatment.id} id={String(treatment.id)} style={{backgroundColor: treatmentTypeColorMap[treatment.treatment_type]}}>
                <button onClick={handleClick} className='float-right' treatment-id ={treatment.id} style={{backgroundColor: treatmentTypeColorMap[treatment.treatment_type]}}>x</button>
                <div className="p-1">Patient: {treatment.patient_name}</div>
                <div className="p-1">Arrived At:{treatment.arrived_at}</div>
                <div className="p-1">Treatment Type: {treatment.treatment_type}</div>
                <div className="p-1">Complete By: {treatment.complete_by}</div>
              </div>
            ))}
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <br></br>
              <label htmlFor="patient_name">Patient Name: </label>
              <input type="text" name="patient_name" id="patient_name"></input>
              <br></br>
              <label htmlFor="arrived_at">Patient Arrival Time: </label>
              <input type="time" name="arrived_at" id="arrived_at"></input>
              <br></br>
              <label htmlFor="treatment_type">Treatment Type: </label>
              {/* <input type='number' name="treatment_type" id="treatment_type" min="0" max="10"></input> */}
              <select id="treatment_type" name="treatment_type">
                <option value="QT">Quick Treat</option>
                <option value="SD">Single Drug</option>
                <option value="MD">Multi Drug</option>
                <option value="DTU">DTU</option>
              </select>
              <br></br>
              <label>Estimated Completion Time: </label>
              <input type="time" name="complete_by" id="complete_by" ></input>
              <br></br>
              <button type="submit">Add Treatment</button>
            </form>
          </div>
        </div>
        <div id="nurses" className="pl-4">
          <h2 className="text-xl font-bold">Nurses</h2>
          <div className='grid grid-cols-6 gap-x-[10px] px-4'>
            {nurseSchedules.map((nurseSchedule) =>  (
              <div key={nurseSchedule.id} className="rounded-lg h-screen w-32 font-bold static" onDragOver={handleDragOver} onDrop={handleDrop} style={{ backgroundColor: "#F9E79F"}}>
                <div>{nurseSchedule.name}</div>
                <div id={String(nurseSchedule.id)} className="h-screen" ref={ref} style={{position: "relative"}}>{treatments.filter((treatment => treatment.assigned_to === nurseSchedule.id)).map((treatment) => (
                  <div
                    id={String(treatment.id)}
                    key={treatment.id}
                    className='font-normal static rounded-lg text-left'
                    style={{
                      fontSize:"10px",
                      fontWeight: "bold",
                      backgroundColor: treatmentTypeColorMap[treatment.treatment_type],
                      position: "absolute",
                      top: `${treatment.y}px`,
                      left: `${treatment.x}%`,
                      height:`${treatment.height}%`,
                      width: `${treatment.width}%`,
                    }}
                    onDragStart={handleDragStart}
                    draggable="true"
                  >
                    <div className="p-1">{treatment.treatment_type}: {treatment.patient_name}
                      <div id={String(treatment.id)} className="float-right" onClick={handleRemoveTreatmentFromSchedule}>x</div>
                    </div>
                    {timeStringToNumber(treatment.complete_by)-timeStringToNumber(treatment.arrived_at) > 15 && <div className='p-1'>{treatment.arrived_at}-{treatment.complete_by}</div>}
                  </div>
              ))}</div>
            </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App

