using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PackageGenerator : MonoBehaviour {
	public GameObject package; 
	// Use this for initialization
	void Start () 
	{
		



	}
	
	// Update is called once per frame
	void Update () 
	{
		
	}

	void CreatePackage () 
	{
		var cube = Instantiate(package);
		// Dimensions
		cube.transform.localScale = new Vector3(5F,4F, 1F);
		// Position 
		cube.transform.position = new Vector3(0, 0, 0);
	}
}
