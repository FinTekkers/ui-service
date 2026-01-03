<script lang="ts">
  // internal imports
  export let obrCardPosition: string;
  export let obrStepNumber: number;
</script>

<div class={`obr_prompt_card ${obrCardPosition} shadow-xl`}>
  <div class="arrow_tip" />
  <button class="obr_btnnext obr_prompt_btn">Next</button>
  <h6 class="step_number">{obrStepNumber}/4</h6>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  .obr_prompt_card {
    padding: 0.5em;
    min-width: 20vw;
    height: 20vh;
    max-width: max-content;
    border-radius: $bd-radius;
    background-color: $primary-color;
    color: $white;
    font-weight: bold;
    position: absolute;

    .obr_prompt_btn {
      color: $primary-color;
      min-width: 5vw;
      height: 5vh;
      font-size: 0.8rem;
      border: solid 1px $primary-color;
      border-radius: $bd-radius;
      padding: 0 0.5em;
      position: absolute;
      transition: all 0.5s ease-in-out;

      &:hover {
        background-color: $primary-color;
        color: $white;
      }
    }

    .step_number {
      color: $white;
      font-weight: 300;
      font-size: 0.8rem;
      position: absolute;
      bottom: 5px;
      left: 10px;
    }

    .obr_btnnext {
      right: 5px;
      bottom: 5px;
    }

    .obr_btnprev {
      right: 55px;
      bottom: 5px;
    }
  }

  .obr_stepone {
    @extend .debug;

    .arrow_tip {
      @extend .centerAbsolute;
      top: -10px;
      transform: rotate(45deg);
      background-color: $primary-color;
      width: 1.5vw;
      aspect-ratio: 1/1;
    }
  }
</style>
