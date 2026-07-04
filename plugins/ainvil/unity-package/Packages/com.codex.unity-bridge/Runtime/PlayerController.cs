using UnityEngine;

namespace Codex.UnityBridge.Sample
{
    /// <summary>
    /// Minimal sample controller used by the AInvil top-down collectible
    /// vertical slice harness. Projects can replace it with their own
    /// production controller after the sample validation path is proven.
    /// </summary>
    [DisallowMultipleComponent]
    [RequireComponent(typeof(CharacterController))]
    public sealed class PlayerController : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 4f;

        private CharacterController characterController;

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
        }

        private void Update()
        {
            var horizontal = Input.GetAxisRaw("Horizontal");
            var vertical = Input.GetAxisRaw("Vertical");
            var move = new Vector3(horizontal, 0f, vertical);
            if (move.sqrMagnitude > 1f)
            {
                move.Normalize();
            }

            characterController.Move(move * moveSpeed * Time.deltaTime);
        }

        public object GetDebugState()
        {
            return new
            {
                ok = true,
                position = transform.position,
                moveSpeed
            };
        }
    }
}
